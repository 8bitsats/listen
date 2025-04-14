#[cfg(all(feature = "solana", feature = "http"))]
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use {
        actix_cors::Cors,
        actix_web::{middleware, web, App, HttpResponse, HttpServer, Responder},
        listen_kit::reasoning_loop::ReasoningLoop,
        listen_kit::signer::solana::LocalSolanaSigner,
        listen_kit::signer::SignerContext,
        listen_kit::solana::util::env,
        serde::{Deserialize, Serialize},
        std::sync::Arc,
    };

    use listen_kit::{
        agent::model_to_versioned_model,
        reasoning_loop::Model,
        solana::agent::{
            create_solana_agent_claude, create_solana_agent_deepseek,
            create_solana_agent_gemini, create_solana_agent_openrouter,
            Features,
        },
    };

    // Load environment variables
    dotenv::dotenv().ok();
    listen_kit::solana::util::init_logger().unwrap();
    tracing::info!("Starting Solana Agent HTTP Server");

    // Initialize the Solana signer
    let signer = LocalSolanaSigner::new(env("SOLANA_PRIVATE_KEY"));
    let signer_arc = Arc::new(signer);

    // Define the message structure for requests
    #[derive(Deserialize)]
    struct AgentRequest {
        message: String,
        model: Option<String>,
        features: Option<Features>,
        language: Option<String>,
    }

    #[derive(Serialize)]
    struct AgentResponse {
        messages: Vec<serde_json::Value>,
    }

    // Handler for agent requests
    async fn handle_agent_request(
        data: web::Json<AgentRequest>,
        signer: web::Data<Arc<LocalSolanaSigner>>,
    ) -> impl Responder {
        let features = data.features.clone().unwrap_or(Features {
            autonomous: false,
            deep_research: false,
        });
        
        let language = data.language.clone().unwrap_or_else(|| "en".to_string());
        
        let model_name = data.model.clone().unwrap_or_else(|| "gemini".to_string());
        
        let result = SignerContext::with_signer(signer.get_ref().clone(), async {
            let model = match model_name.as_str() {
                "gemini" => Model::Gemini(Arc::new(create_solana_agent_gemini(
                    None,
                    features,
                    language,
                ))),
                "openrouter-llama" => {
                    Model::OpenRouter(Arc::new(create_solana_agent_openrouter(
                        None,
                        features,
                        language,
                        Some(model_to_versioned_model("llama".to_string())),
                    )))
                }
                "openrouter-claude" => {
                    Model::OpenRouter(Arc::new(create_solana_agent_openrouter(
                        None,
                        features,
                        language,
                        Some(model_to_versioned_model("claude".to_string())),
                    )))
                }
                "openrouter-gemini" => {
                    Model::OpenRouter(Arc::new(create_solana_agent_openrouter(
                        None,
                        features,
                        language,
                        Some(model_to_versioned_model("gemini".to_string())),
                    )))
                }
                "openrouter-openai" => {
                    Model::OpenRouter(Arc::new(create_solana_agent_openrouter(
                        None,
                        features,
                        language,
                        Some(model_to_versioned_model("openai".to_string())),
                    )))
                }
                "openrouter-deepseek" => {
                    Model::OpenRouter(Arc::new(create_solana_agent_openrouter(
                        None,
                        features,
                        language,
                        Some(model_to_versioned_model("deepseek".to_string())),
                    )))
                }
                "deepseek" => {
                    Model::DeepSeek(Arc::new(create_solana_agent_deepseek(
                        None,
                        features,
                        language,
                    )))
                }
                "claude" => Model::Claude(Arc::new(create_solana_agent_claude(
                    None,
                    features,
                    language,
                ))),
                _ => Model::Gemini(Arc::new(create_solana_agent_gemini(
                    None,
                    features,
                    language,
                ))),
            };

            let trader_agent = ReasoningLoop::new(model).with_stdout(true);

            trader_agent
                .stream(data.message.clone(), vec![], None)
                .await
        }).await;

        match result {
            Ok(messages) => {
                // Create a new vector of JSON objects manually
                let mut serializable_messages = Vec::new();
                
                for msg in messages {
                    let role = match msg.role.as_str() {
                        "assistant" => "assistant",
                        "user" => "user",
                        _ => "system",
                    };
                    
                    let content = msg.content.clone().unwrap_or_default();
                    
                    // Create a simple JSON object with role and content
                    let json_msg = serde_json::json!({
                        "role": role,
                        "content": content,
                        "id": format!("{}", serializable_messages.len()),
                    });
                    
                    serializable_messages.push(json_msg);
                }
                
                HttpResponse::Ok().json(AgentResponse { messages: serializable_messages })
            },
            Err(err) => {
                tracing::error!("Agent error: {:?}", err);
                HttpResponse::InternalServerError().body(format!("Error: {}", err))
            }
        }
    }

    // Handler for health check
    async fn health_check() -> impl Responder {
        HttpResponse::Ok().body("Solana Agent is running")
    }

    // Start the HTTP server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(middleware::Logger::default())
            .wrap(cors)
            .app_data(web::Data::new(signer_arc.clone()))
            .app_data(web::JsonConfig::default().limit(4096 * 1024)) // 4MB limit
            .route("/health", web::get().to(health_check))
            .route("/agent", web::post().to(handle_agent_request))
    })
    .bind("127.0.0.1:3030")?
    .run()
    .await?;

    Ok(())
}

#[cfg(not(all(feature = "solana", feature = "http")))]
fn main() {
    tracing::warn!("enable both the 'solana' and 'http' features to run this example.");
}

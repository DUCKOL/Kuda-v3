// // =================================================================
// // SECTION 1: SETUP & SIMULATION
// // 在真实项目中，这部分会是你的配置文件和实际的API请求模块。
// // =================================================================

// /**
//  * 定义API密钥对象的数据结构。
//  * 使用接口可以增加代码的可读性和健壮性。
//  */
// interface ApiKeyInfo {
//     key: string;
//     index: number;
//     description: string;
// }

// /**
//  * 模拟你的密钥配置列表。
//  * 我们特意设置了三种不同的场景来测试我们的逻辑。
//  */
// const geminiApiKeys: ApiKeyInfo[] = [
//     { key: 'API_KEY_001_QUOTA_EXCEEDED', index: 1, description: '免费额度已用尽' },
//     { key: 'API_KEY_002_SERVER_OVERLOADED', index: 2, description: '服务器过载' },
//     { key: 'API_KEY_003_VALID_KEY', index: 3, description: '有效的密钥' },
// ];

// /**
//  * 模拟一个真实的 Google Gemini API 调用。
//  * 这个函数根据传入的密钥，精心模拟了三种关键的返回场景。
//  * 
//  * @param keyInfo - 包含密钥和元数据的对象。
//  * @param model - 要调用的AI模型名称。
//  * @param prompt - 发送给模型的提示文本。
//  * @returns {Promise<any>} 返回一个Promise，它可能解析为API的JSON响应，也可能因网络错误而被拒绝。
//  */
// async function mockGeminiApiCall(keyInfo: ApiKeyInfo, model: string, prompt: string): Promise<any> {
//     console.log(`[API MOCK] 正在向模型 [${model}] 发起请求... (使用密钥 #${keyInfo.index}: ${keyInfo.description})`);

//     // 返回一个新的Promise来模拟异步网络请求
//     return new Promise((resolve, reject) => {
//         // 随机延迟，让模拟更真实
//         const delay = 500 + Math.random() * 500;

//         setTimeout(() => {
//             switch (keyInfo.key) {
//                 // 场景1: API返回200 OK，但响应体是错误信息（例如，额度用尽）
//                 case 'API_KEY_001_QUOTA_EXCEEDED':
//                     resolve({
//                         "error": {
//                             "code": 429,
//                             "message": `You have exceeded your quota for the API. Please check your billing account. (key #${keyInfo.index})`,
//                             "status": "RESOURCE_EXHAUSTED"
//                         }
//                     });
//                     break;

//                 // 场景2: API返回服务器错误（例如，503），导致Promise被拒绝
//                 case 'API_KEY_002_SERVER_OVERLOADED':
//                     const serverError = new Error(`The model is currently overloaded. Please try again later. (key #${keyInfo.index})`);
//                     // 附加一个模拟的响应对象，这在实际的HTTP客户端中很常见
//                     (serverError as any).response = { status: 503 };
//                     reject(serverError);
//                     break;

//                 // 场景3: API调用完全成功
//                 case 'API_KEY_003_VALID_KEY':
//                     resolve({
//                         "candidates": [{
//                             "content": {
//                                 "parts": [{ "text": `这是一个来自有效密钥 #${keyInfo.index} 的成功响应，针对提示: '${prompt}'` }],
//                                 "role": "model"
//                             },
//                         }],
//                     });
//                     break;
                
//                 // 默认情况，以防万一
//                 default:
//                     reject(new Error(`未知的API密钥配置: ${keyInfo.key}`));
//                     break;
//             }
//         }, delay);
//     });
// }


// // =================================================================
// // SECTION 2: CORE LOGIC
// // 这是你需要集成到你应用中的核心错误处理和重试模块。
// // =================================================================

// /**
//  * 带有回退和重试逻辑的Gemini API调用器。
//  * 此函数封装了所有复杂的错误处理，使得业务逻辑可以简单地调用它。
//  * 
//  * @param keys - 一个包含API密钥信息的对象数组。
//  * @param model - 要调用的模型名称。
//  * @param prompt - 要发送的提示。
//  * @returns {Promise<any>} 如果成功，则解析为第一次成功的API响应。
//  * @throws {Error} 如果所有密钥都尝试失败，则抛出一个聚合性的错误。
//  */
// export async function callGeminiWithFallback(keys: ApiKeyInfo[], model: string, prompt: string): Promise<any> {
//     console.log(`\n[FALLBACK HANDLER] 启动AI请求流程，检测到 ${keys.length} 个备用密钥。`);

//     let lastKnownError: Error | null = null; // 用于在最终失败时提供更详细的上下文

//     // 按顺序遍历所有提供的密钥
//     for (const currentKey of keys) {
//         console.log(`[FALLBACK HANDLER] 尝试密钥 #${currentKey.index} (${currentKey.description})...`);

//         try {
//             // 步骤 1: 发起API调用
//             const result = await mockGeminiApiCall(currentKey, model, prompt);
            
//             // 步骤 2: **检查业务逻辑错误**
//             // 这是关键！即使网络请求成功，我们也要检查响应体是否表示一个逻辑上的失败。
//             // Gemini API通过在响应中包含一个'error'字段来表示这类失败。
//             if (result && result.error) {
//                 // 创建一个描述性的错误消息
//                 const businessError = new Error(`API返回业务错误: ${result.error.message}`);
//                 // **手动抛出此错误**，以便它能被下面的catch块捕获，从而触发重试逻辑。
//                 throw businessError;
//             }

//             // 步骤 3: 处理完全成功的情况
//             // 如果代码执行到这里，意味着API调用既没有网络错误，响应体也是有效的。
//             console.log(`✅ [FALLBACK HANDLER] 成功！密钥 #${currentKey.index} 工作正常。`);
//             // 立即返回成功的结果，这将终止整个函数和循环。
//             return result;

//         } catch (error: any) {
//             // 步骤 4: 统一处理所有类型的失败
//             // 这个catch块会捕获两种错误：
//             // 1. 来自 `mockGeminiApiCall` 的网络/服务器错误 (Promise rejection)。
//             // 2. 我们在上面 `if (result.error)` 块中手动 `throw` 的业务逻辑错误。
//             lastKnownError = error; // 保存最后一个错误信息以备后用
//             console.error(`❌ [FALLBACK HANDLER] 密钥 #${currentKey.index} 尝试失败。原因: ${error.message}`);
//             // 循环将自动继续到下一个密钥。
//         }
//     }

//     // 步骤 5: 处理所有尝试都失败的情况
//     // 如果for循环正常结束（即没有从try块中成功返回），说明所有密钥都已用尽。
//     const finalErrorMessage = "所有备用API密钥均已尝试失败，无法完成请求。";
//     console.error(`\n[FALLBACK HANDLER] 最终失败: ${finalErrorMessage}`);
    
//     // 抛出一个最终的、信息丰富的错误。
//     throw new Error(`${finalErrorMessage}\n最后记录的错误是: ${lastKnownError?.message || '未知错误'}`);
// }


// // =================================================================
// // SECTION 3: APPLICATION USAGE
// // 这是你的主程序，它调用核心逻辑并处理最终结果。
// // =================================================================

// async function main() {
//     console.log("--- 应用启动 ---");
//     const userPrompt = "请给我写一个关于太空探索的笑话。";

//     try {
//         // 只需调用一个函数，所有复杂的重试逻辑都被封装好了。
//         const successfulResponse = await callGeminiWithFallback(geminiApiKeys, 'gemini-1.5-pro', userPrompt);
        
//         // 如果成功，在这里处理最终的有效响应
//         console.log("\n\n🎉 [MAIN APP] 请求最终成功！");
//         console.log("收到的最终响应内容:");
//         // 解析并打印出模型返回的文本
//         const textResponse = successfulResponse.candidates[0].content.parts[0].text;
//         console.log(`> "${textResponse}"`);

//     } catch (error: any) {
//         // 如果所有尝试都失败了，在这里处理最终的错误
//         console.error("\n\n💥 [MAIN APP] 请求最终失败！");
//         console.error("错误详情:", error.message);
//     }
    
//     console.log("\n--- 应用结束 ---");
// }

// // 运行主程序
// main();


/**
 * @file geminiApiService.ts
 * @description
 * 这是一个专用于调用 Google Gemini API 的服务模块。
 * 它封装了以下核心功能：
 * 1. 从环境变量中安全地读取多个 API 密钥。
 * 2. 实现了带有多密钥回退（Fallback）和重试的健壮调用逻辑。
 * 3. 能够处理网络/服务器错误以及 API 返回的业务逻辑错误（如额度用尽）。
 * 4. 支持多模态输入（文本 + 图片），专门用于 gemini-pro-vision 模型。
 */

import axios from 'axios'; // 确保你已经在项目中安装了 axios: pnpm install axios

// =================================================================
// SECTION 1: CONFIGURATION & SETUP
// =================================================================

/**
 * 定义 API 密钥对象的数据结构。
 */
interface ApiKeyInfo {
    key: string;
    index: number;
}

// 从环境变量中读取逗号分隔的 API 密钥字符串
const apiKeysFromEnv = process.env.GEMINI_API_KEYS?.split(',') || [];

// 预处理密钥：去除空白并构建成对象数组
const geminiApiKeys: ApiKeyInfo[] = apiKeysFromEnv
    .map(key => key.trim()) // 去除每个 key 前后的空格
    .filter(key => key.length > 0) // 过滤掉空的 key
    .map((key, index) => ({
        key: key,
        index: index + 1,
    }));

// 在应用启动时进行一次性检查，如果未配置密钥则在控制台发出警告
if (geminiApiKeys.length === 0) {
    console.warn(
        "[API Service] 警告: 未在环境变量中配置 GEMINI_API_KEYS。" +
        "AI 相关功能将无法使用。请在项目根目录的 .env 文件中进行配置，例如: " +
        'GEMINI_API_KEYS="key1,key2,key3"'
    );
}

// =================================================================
// SECTION 2: INTERNAL API CALLER
// =================================================================

/**
 * 实际执行对 Google Gemini API 的网络请求。
 * 这是一个内部函数，不应被外部模块直接调用。
 * @param keyInfo 当前尝试的密钥信息
 * @param prompt 用户的文本提示
 * @param imageBase64 截图的 Base64 编码字符串 (不含 "data:image/png;base64,")
 * @returns {Promise<any>} 返回 API 的 JSON 响应体
 */
async function realGeminiApiCall(keyInfo: ApiKeyInfo, prompt: string, imageBase64: string): Promise<any> {
    const model = 'gemini-pro-vision'; // 明确使用多模态模型
    console.log(`[API Service] 正在向模型 [${model}] 发起请求... (使用密钥 #${keyInfo.index})`);
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyInfo.key}`;

    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inline_data: {
                        mime_type: "image/png",
                        data: imageBase64
                    }
                }
            ]
        }],
    };

    // 使用 axios 发起 POST 请求。如果 HTTP 状态码不是 2xx，axios 会自动抛出错误。
    const response = await axios.post(API_URL, requestBody, {
        headers: { 'Content-Type': 'application/json' }
    });
    
    return response.data;
}

// =================================================================
// SECTION 3: EXPORTED CORE LOGIC
// =================================================================

/**
 * 带有回退和重试逻辑的 Gemini API 调用器。
 * 这是该模块唯一导出的函数，供主进程 (main.ts) 调用。
 * @param prompt 用户的文本提示
 * @param imageBase64 截图的 Base64 编码字符串
 * @returns {Promise<any>} 如果成功，则解析为第一次成功的 API 响应。
 * @throws {Error} 如果所有密钥都尝试失败，则抛出一个聚合性的错误。
 */
export async function callGeminiWithFallback(prompt: string, imageBase64: string): Promise<any> {
    // 步骤 1: 守卫检查，如果没有配置密钥，则直接抛出清晰的错误
    if (geminiApiKeys.length === 0) {
        throw new Error("没有配置 GEMINI API 密钥，AI 功能不可用。");
    }

    console.log(`[FALLBACK HANDLER] 启动AI请求流程，检测到 ${geminiApiKeys.length} 个备用密钥。`);
    let lastKnownError: Error | null = null;

    // 步骤 2: 依次遍历所有密钥进行尝试
    for (const currentKey of geminiApiKeys) {
        console.log(`[FALLBACK HANDLER] 尝试密钥 #${currentKey.index}...`);
        try {
            // 发起真实的 API 调用
            const result = await realGeminiApiCall(currentKey, prompt, imageBase64);
            
            // 检查 API 是否返回了业务逻辑错误 (例如：无效的请求内容)
            if (result && result.error) {
                throw new Error(`API 返回业务错误: ${result.error.message}`);
            }

            // 如果代码执行到这里，说明请求完全成功
            console.log(`✅ [FALLBACK HANDLER] 成功！密钥 #${currentKey.index} 工作正常。`);
            return result;

        } catch (error: any) {
            // 统一处理所有类型的失败 (网络错误、业务错误等)
            // 优化错误日志，如果是 axios 错误，则显示更详细的信息
            if (error.response) {
                lastKnownError = new Error(`API 请求失败，状态码: ${error.response.status}, 响应: ${JSON.stringify(error.response.data)}`);
            } else {
                lastKnownError = error;
            }
            console.error(`❌ [FALLBACK HANDLER] 密钥 #${currentKey.index} 失败: ${lastKnownError.message}`);
        }
    }

    // 步骤 3: 如果循环结束仍未成功，则抛出最终错误
    const finalErrorMessage = "所有备用API密钥均尝试失败，无法完成AI请求。";
    console.error(`\n[FALLBACK HANDLER] 最终失败: ${finalErrorMessage}`);
    
    throw new Error(`${finalErrorMessage}\n最后记录的错误是: ${lastKnownError?.message || '未知错误'}`);
}
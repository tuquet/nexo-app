import { Root, AspectRatio } from '../types';
import { db } from '../db';
import { useApiKey } from '../contexts/ApiKeyContext';
import { generateSceneImage as geminiGenerateSceneImage, generateSceneVideo as geminiGenerateSceneVideo, blobToBase64 } from '../services/geminiService';

const base64ToBlob = async (base64: string): Promise<Blob> => {
  const response = await fetch(base64);
  return await response.blob();
};

export const useAssets = (
    setActiveScript: (script: Root) => void,
    saveActiveScript: (script: Root) => Promise<void>,
    setError: (error: string | null) => void,
) => {
    const { apiKey } = useApiKey();

    const generateSceneImage = async (script: Root, actIndex: number, sceneIndex: number, finalPrompt: string, finalNegativePrompt: string, aspectRatio: AspectRatio) => {
        if (!script || !script.id || !apiKey) return;
        const scriptId = script.id;

        const scriptWithGeneratingFlag = structuredClone(script);
        scriptWithGeneratingFlag.acts[actIndex].scenes[sceneIndex].isGeneratingImage = true;
        setActiveScript(scriptWithGeneratingFlag);

        try {
            const imageUrl = await geminiGenerateSceneImage(finalPrompt, aspectRatio, apiKey, finalNegativePrompt);
            const imageBlob = await base64ToBlob(imageUrl);
            const imageId = await db.images.add({ data: imageBlob, scriptId });
            window.dispatchEvent(new CustomEvent('assets-changed'));

            const updatedScript = structuredClone(scriptWithGeneratingFlag);
            const targetScene = updatedScript.acts[actIndex].scenes[sceneIndex];
            targetScene.generatedImageId = imageId;
            targetScene.isGeneratingImage = false;
            await saveActiveScript(updatedScript);
        } catch (err) {
            console.error("Không thể tạo ảnh cho cảnh:", err);
            const revertedScript = structuredClone(script);
            revertedScript.acts[actIndex].scenes[sceneIndex].isGeneratingImage = false;
            setActiveScript(revertedScript);
            setError(err instanceof Error ? err.message : 'Không thể tạo ảnh.');
        }
    };

    const cancelGenerateSceneImage = (script: Root, actIndex: number, sceneIndex: number) => {
        if (!script) return;
        const newScript = structuredClone(script);
        const scene = newScript.acts?.[actIndex]?.scenes?.[sceneIndex];
        if (scene) {
            scene.isGeneratingImage = false;
        }
        setActiveScript(newScript);
    };

    const generateSceneVideo = async (script: Root, actIndex: number, sceneIndex: number, aspectRatio: AspectRatio) => {
        if (!script || !script.id || !apiKey) return;
        const scriptId = script.id;

        const scriptWithGeneratingFlag = structuredClone(script);
        scriptWithGeneratingFlag.acts[actIndex].scenes[sceneIndex].isGeneratingVideo = true;
        setActiveScript(scriptWithGeneratingFlag);

        const scene = script.acts[actIndex].scenes[sceneIndex];
        const prompt = `Cinematic shot for a movie scene. Location: ${scene.location} (${scene.time}). Action: ${scene.action}. Visual style: ${scene.visual_style}. Audio style: ${scene.audio_style}.`;

        try {
            let startImage: { mimeType: string; data: string; } | undefined = undefined;
            if (scene.generatedImageId) {
                const imageRecord = await db.images.get(scene.generatedImageId);
                if (imageRecord?.data) {
                    const base64Data = await blobToBase64(imageRecord.data);
                    startImage = { mimeType: imageRecord.data.type, data: base64Data };
                }
            }

            const videoBlob = await geminiGenerateSceneVideo(prompt, aspectRatio, apiKey, startImage);
            const videoId = await db.videos.add({ data: videoBlob, scriptId });
            window.dispatchEvent(new CustomEvent('assets-changed'));

            const updatedScript = structuredClone(scriptWithGeneratingFlag);
            const targetScene = updatedScript.acts[actIndex].scenes[sceneIndex];
            targetScene.generatedVideoId = videoId;
            targetScene.isGeneratingVideo = false;
            await saveActiveScript(updatedScript);

        } catch (err) {
            console.error("Không thể tạo video cho cảnh:", err);
            const revertedScript = structuredClone(script);
            revertedScript.acts[actIndex].scenes[sceneIndex].isGeneratingVideo = false;
            setActiveScript(revertedScript);
            
            const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
            setError(`Tạo video thất bại: ${errorMessage}`);
        }
    };

    const deleteSceneImage = async (script: Root, actIndex: number, sceneIndex: number) => {
        if (!script) return;
        const scriptToUpdate = structuredClone(script);
        const scene = scriptToUpdate.acts[actIndex].scenes[sceneIndex];
        const imageIdToDelete = scene.generatedImageId;

        if (imageIdToDelete) {
            try {
                await db.images.delete(imageIdToDelete);
                delete scene.generatedImageId;
                await saveActiveScript(scriptToUpdate);
                window.dispatchEvent(new CustomEvent('assets-changed'));
            } catch (err) {
                console.error("Không thể xóa ảnh cảnh:", err);
                setError("Không thể xóa tài sản ảnh.");
            }
        }
    };

    const deleteSceneVideo = async (script: Root, actIndex: number, sceneIndex: number) => {
        if (!script) return;
        const scriptToUpdate = structuredClone(script);
        const scene = scriptToUpdate.acts[actIndex].scenes[sceneIndex];
        const videoIdToDelete = scene.generatedVideoId;

        if (videoIdToDelete) {
            try {
                await db.videos.delete(videoIdToDelete);
                delete scene.generatedVideoId;
                await saveActiveScript(scriptToUpdate);
                window.dispatchEvent(new CustomEvent('assets-changed'));
            } catch (err) {
                console.error("Không thể xóa video cảnh:", err);
                setError("Không thể xóa tài sản video.");
            }
        }
    };

    const deleteAssetFromGallery = async (assetType: 'image' | 'video', assetId: number, scriptId: number) => {
        try {
            await (assetType === 'image' ? db.images.delete(assetId) : db.videos.delete(assetId));
            
            const scriptToUpdate = await db.scripts.get(scriptId);
            if (scriptToUpdate) {
                let wasUpdated = false;
                for (const act of scriptToUpdate.acts) {
                    for (const scene of act.scenes) {
                        if (assetType === 'image' && scene.generatedImageId === assetId) {
                            delete scene.generatedImageId;
                            wasUpdated = true;
                        }
                        if (assetType === 'video' && scene.generatedVideoId === assetId) {
                            delete scene.generatedVideoId;
                            wasUpdated = true;
                        }
                    }
                }
                if (wasUpdated) {
                    await saveActiveScript(scriptToUpdate);
                }
            }
            
            window.dispatchEvent(new CustomEvent('assets-changed'));
        } catch(err) {
             console.error(`Không thể xóa tài sản ${assetId} khỏi thư viện:`, err);
             setError("Không thể xóa tài sản khỏi thư viện.");
        }
    };

    return {
        generateSceneImage,
        cancelGenerateSceneImage,
        generateSceneVideo,
        deleteSceneImage,
        deleteSceneVideo,
        deleteAssetFromGallery
    };
};

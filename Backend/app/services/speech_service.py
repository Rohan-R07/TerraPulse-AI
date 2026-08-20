import logging
import base64
from app.config import settings

logger = logging.getLogger("TerraPulseBackend.Speech")

speech_available = False
try:
    from google.cloud import speech_v1p1beta1 as speech
    from google.cloud import texttospeech
    speech_available = True
except Exception as e:
    logger.warning(f"Google Cloud Speech/TTS client libraries failed to load: {e}. Running in Speech Fallback Mode.")

class SpeechService:
    @staticmethod
    def speech_to_text(audio_content: bytes, language: str) -> str:
        if speech_available and not settings.TERRAPULSE_DEMO_MODE:
            try:
                client = speech.SpeechClient()
                config = speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                    sample_rate_hertz=48000,
                    language_code=language,
                )
                audio_obj = speech.RecognitionAudio(content=audio_content)
                response = client.recognize(config=config, audio=audio_obj)
                
                transcript = ""
                for result in response.results:
                    transcript += result.alternatives[0].transcript
                    
                if transcript:
                    return transcript
            except Exception as e:
                logger.error(f"Google Cloud Speech API failed: {e}. Falling back to mock transcription.")

        # High-fidelity multi-lingual fallback transcriptions
        mock_transcripts = {
            "hi-IN": "NDVI का स्तर क्यों गिर गया है?",
            "mr-IN": "माझे पीक का सुकले आहे?",
            "kn-IN": "ನನ್ನ ಬೆಳೆ ಯಾವಾಗ ನೀರಾವರಿ ಮಾಡಬೇಕು?",
            "bn-IN": "আমার ফসলে কী সার দেওয়া দরকার?",
            "en-IN": "Why did my field NDVI fall this month?"
        }
        return mock_transcripts.get(language, "Why is my crop stressed?")

    @staticmethod
    def text_to_speech(text: str, language: str) -> dict:
        if speech_available and not settings.TERRAPULSE_DEMO_MODE:
            try:
                client = texttospeech.TextToSpeechClient()
                synthesis_input = texttospeech.SynthesisInput(text=text)
                
                voice = texttospeech.VoiceSelectionParams(
                    language_code=language,
                    ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
                )
                audio_config = texttospeech.AudioConfig(
                    audio_encoding=texttospeech.AudioEncoding.MP3
                )
                
                response = client.synthesize_speech(
                    input=synthesis_input, voice=voice, audio_config=audio_config
                )
                
                audio_base64 = base64.b64encode(response.audio_content).decode("utf-8")
                return {"audioContent": audio_base64, "fallback": False}
            except Exception as e:
                logger.error(f"Google Cloud TTS API failed: {e}. Returning fallback indicator.")

        # Return empty response to trigger client-side Web Speech API fallback
        return {"audioContent": "", "fallback": True}

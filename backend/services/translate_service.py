import os
import requests
import uuid
from typing import Optional

class TranslateService:
    def __init__(self):
        self.subscription_key = os.getenv('AZURE_TRANSLATOR_KEY')
        self.endpoint = os.getenv('AZURE_TRANSLATOR_ENDPOINT', 'https://api.cognitive.microsofttranslator.com')
        self.location = os.getenv('AZURE_TRANSLATOR_LOCATION', 'global')
        
    # check if the service is active
    def is_active(self) -> bool:
        return self.subscription_key is not None and self.endpoint is not None and self.location is not None
        
    def translate(self, text: str, target_language: str, source_language: Optional[str] = None) -> str:
        """
        Translate text using Microsoft Translator service
        
        Args:
            text: Text to translate
            target_language: Target language code (e.g., 'en', 'zh-Hans')
            source_language: Source language code (optional)
            
        Returns:
            Translated text
        """
        path = '/translate'
        constructed_url = self.endpoint + path

        params = {
            'api-version': '3.0',
            'to': target_language
        }
        
        if source_language:
            params['from'] = source_language

        headers = {
            'Ocp-Apim-Subscription-Key': self.subscription_key,
            'Ocp-Apim-Subscription-Region': self.location,
            'Content-type': 'application/json',
            'X-ClientTraceId': str(uuid.uuid4())
        }

        body = [{
            'text': text
        }]

        response = requests.post(constructed_url, params=params, headers=headers, json=body)
        response.raise_for_status()
        
        translations = response.json()
        return translations[0]['translations'][0]['text'] 
    
translate_service = TranslateService()
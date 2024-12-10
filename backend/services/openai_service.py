from typing import List
from openai.types.chat import ChatCompletionMessageParam
from openai.types.chat.completion_create_params import ResponseFormat
from openai import AsyncOpenAI
import os

openai_client = AsyncOpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    base_url=os.getenv('OPENAI_API_BASE', 'https://api.openai.com/v1')  # Support custom base URL
)

default_model = os.getenv('OPENAI_API_MODEL')
default_temperature = float(os.getenv('OPENAI_API_TEMPERATURE', 0.5))

class OpenAIService:
    @staticmethod
    async def chat_completion(
        messages: List[ChatCompletionMessageParam], 
        model: str = default_model,
        temperature: float = default_temperature,
        response_format: ResponseFormat = None
    ) -> str:
        """
        Call OpenAI Chat Completion API
        
        Args:
            messages: List of messages
            model: Model name
            temperature: Temperature parameter
            response_format: Response format parameter
            
        Returns:
            str: AI response text
        """
        try:
            response = await openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                response_format=response_format
            )
            print('openai response', response)
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"OpenAI API call failed: {str(e)}") 
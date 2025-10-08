import json
import os
from typing import Dict

class I18n:
    def __init__(self):
        self.translations = {}
        self.load_translations()
    
    def load_translations(self):
        locales_dir = os.path.join(os.path.dirname(__file__), "locales")
        for lang in ["en", "tr"]:
            file_path = os.path.join(locales_dir, f"{lang}.json")
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    self.translations[lang] = json.load(f)
    
    def get_text(self, key: str, lang: str = "tr") -> str:
        return self.translations.get(lang, {}).get(key, key)
    
    def get_bilingual_response(self, key: str) -> Dict[str, str]:
        return {
            "en": self.get_text(key, "en"),
            "tr": self.get_text(key, "tr")
        }

i18n = I18n()
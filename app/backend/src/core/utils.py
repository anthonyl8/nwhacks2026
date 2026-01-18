import re
from typing import AsyncIterator, Iterator, Union

class Utils:
    @staticmethod
    async def async_speech_chunks(token_stream: AsyncIterator[str]):
        buffer = ""

        async for token in token_stream:
            buffer += token
            
            # Check for sentence endings
            if re.search(r"[.!?]\s*$", buffer):
                yield buffer.strip()
                buffer = ""
            # If buffer is getting long (e.g. > 25 words), try to split on commas or newlines
            elif len(buffer.split()) >= 25:
                # Try to find a comma or similar pause
                matches = list(re.finditer(r"[,;:]\s", buffer))
                if matches:
                    # Split at the last punctuation found to maximize chunk size
                    last_match = matches[-1]
                    split_index = last_match.start() + 1
                    
                    yield buffer[:split_index].strip()
                    buffer = buffer[split_index:]
                else:
                    yield buffer.strip()
                    buffer = ""

        if buffer:
            yield buffer.strip()
            
    @staticmethod
    def speech_chunks(token_stream: Iterator[str]):
        buffer = ""

        for token in token_stream:
            buffer += token

            if re.search(r"[.!?]\s*$", buffer):
                yield buffer.strip()
                buffer = ""
            elif len(buffer.split()) >= 25:
                 matches = list(re.finditer(r"[,;:]\s", buffer))
                 if matches:
                    last_match = matches[-1]
                    split_index = last_match.start() + 1
                    
                    yield buffer[:split_index].strip()
                    buffer = buffer[split_index:]
                 else:
                    yield buffer.strip()
                    buffer = ""

        if buffer:
            yield buffer.strip()

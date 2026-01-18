import re

class Utils:
    @staticmethod
    def speech_chunks(token_stream):
        buffer = ""

        for token in token_stream:
            buffer += token

            # Speak at natural pause points
            if re.search(r"[.!?]\s$", buffer) or len(buffer.split()) >= 10:
                yield buffer.strip()
                buffer = ""

        if buffer:
            yield buffer.strip()
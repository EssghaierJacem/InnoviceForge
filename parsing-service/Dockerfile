FROM python:3.12-slim

WORKDIR /app

RUN groupadd --system app && useradd --system --gid app app

COPY pyproject.toml ./
RUN mkdir app && touch app/__init__.py && pip install --no-cache-dir .

COPY app ./app
RUN pip install --no-cache-dir .

USER app

EXPOSE 8084

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8084"]

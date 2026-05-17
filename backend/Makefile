.PHONY: dev test lint

dev:
	uvicorn main:app --reload --port 8000

test:
	pytest -v

lint:
	ruff check . || flake8 .

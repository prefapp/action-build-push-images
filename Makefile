init:
	docker-compose run --rm action npm install

unit-test:
	docker-compose run --rm action npm test

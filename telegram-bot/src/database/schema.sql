-- src/database/schema.sql

CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    chat_id VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE balances (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER REFERENCES merchants(id),
    origin VARCHAR(50) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    balance DECIMAL(15,2) NOT NULL,
    usd_balance DECIMAL(15,2) NOT NULL,
    balance_limit DECIMAL(15,2) NOT NULL,
    exchange_rate DECIMAL(15,2) NOT NULL
);

INSERT INTO merchants (name, chat_id) VALUES
    ('Test Merchant', '-4667872203');

INSERT INTO balances (merchant_id, origin, currency, balance, usd_balance, balance_limit, exchange_rate) VALUES
    (1, 'Argentina', 'ARS', 10000000.00, 3274.37, -5000.00, 1239.00),
    (1, 'Venezuela', 'VES', 10000.00, 274.37, -500.00, 65.20);
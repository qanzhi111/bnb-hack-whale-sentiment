# Whale-Sentiment Momentum Fusion

> **BNB Hack: AI Trading Agents — Track 2: Strategy Skills**
>
> Multi-factor trading strategy combining technical momentum, on-chain whale tracking, and social sentiment divergence signals.

[![Track: Strategy Skills](https://img.shields.io/badge/Track-Strategy_Skills-FF6B35)](https://dorahacks.io/hackathon/bnbhack-twt-cmc/)
[![Prize: $6,000](https://img.shields.io/badge/Prize_Pool-$6,000-success)](https://dorahacks.io/hackathon/bnbhack-twt-cmc/)
[![CMC MCP](https://img.shields.io/badge/Data-CMC_Agent_Hub-1E88E5)](https://agent.coinmarketcap.com/)

---

## 🎯 Strategy Overview

**Whale-Sentiment Momentum Fusion** is a four-signal trading strategy for BNB Chain tokens that combines:

1. **RSI Mean Reversion** — Buy oversold, sell overbought (weight: 25%)
2. **MACD Crossover** — Trend-following momentum signals (weight: 30%)
3. **Whale Flow Analysis** — On-chain exchange flow tracking (weight: 25%)
4. **Sentiment Divergence** — Price vs. social sentiment divergence (weight: 20%)

### Signal Aggregation

Signals are aggregated with directional consensus:
- All signals must agree on direction (LONG or SHORT) — no conflicting trades
- Weighted strength score determines confidence
- **Confluence bonus**: more simultaneous signals → higher confidence
- **Minimum confidence**: 60/100 required to open a position
- **Max drawdown guard**: strategy halts at 20% drawdown

### Risk Management

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max Position Size | 10% per trade | Diversification across tokens |
| Stop Loss | 5% | Tight risk control per hackathon rules |
| Take Profit | 15% | 3:1 reward/risk ratio |
| Max Drawdown | 20% | Hackathon hard limit |
| Min Confidence | 60/100 | Avoid low-conviction trades |

---

## 📊 CMC Data Tools Used

This strategy leverages **8 of the 12 CMC Agent Hub data tools**:

| Tool | Usage | Signal |
|------|-------|--------|
| OHLCV Historical | Price data for RSI/MACD | RSI, MACD |
| Volume Profile | Volume confirmation | Momentum |
| Large Transactions | Whale tracking | Whale Flow |
| Exchange Inflow/Outflow | Exchange deposit/withdrawal | Whale Flow |
| Social Metrics | Twitter/Reddit sentiment | Sentiment Divergence |
| News Analysis | News sentiment scoring | Sentiment Divergence |
| Fear & Greed Index | Market regime detection | All signals |
| Token Listing | Real-time prices | Execution |

---

## 🤖 How It Works

### Step 1: Data Collection
```
CMC Agent Hub → 12 data tools → Structured signals
```
Agent queries CMC MCP endpoint for real-time and historical data across all 10 BNB Chain tokens.

### Step 2: Signal Generation
```
4 independent signal generators → weighted scores
```
Each generator produces a direction (LONG/SHORT), strength (0-100), and reason.

### Step 3: Aggregation
```
Directional consensus + weighted strength + confluence bonus = confidence score
```
Only trade when confidence > 60 and signals agree.

### Step 4: Risk-Managed Execution
```
Position sizing → Stop loss → Take profit → Drawdown monitor
```
Every trade has defined risk parameters before execution.

---

## 🧪 Backtest Results

Run the included backtest to see simulated performance:

```bash
npm install
npm run backtest
```

The backtest simulates 90 days of 4h candle data across 10 BNB Chain tokens with realistic volatility and drift.

### Expected Metrics (based on simulation)

| Metric | Target |
|--------|--------|
| Win Rate | >55% |
| Profit Factor | >1.5 |
| Max Drawdown | <20% |
| Avg Win/Loss Ratio | >2:1 |

---

## 🏆 Hackathon Judging Criteria

| Criterion | How We Score |
|-----------|-------------|
| **Technical Execution** | 4 independent signal generators, weighted aggregation, full risk management system |
| **Originality** | Novel whale-sentiment divergence concept; not a simple RSI bot |
| **Real-World Value** | Addresses real problem: retail traders lack on-chain intelligence |
| **Presentation** | Clean architecture, backtestable, well-documented |

---

## 📁 Project Structure

```
bnb-hack/
├── strategy.js       # Core strategy engine (signal generators + risk management)
├── README.md         # This file
└── package.json      # Dependencies
```

---

## 🔗 Hackathon Links

- **DoraHacks Registration**: https://dorahacks.io/hackathon/bnbhack-twt-cmc/
- **CMC Agent Hub**: https://agent.coinmarketcap.com/
- **BNB Chain**: https://bnbchain.org/
- **Trust Wallet Agent Kit**: https://developer.trustwallet.com/

---

**Built for BNB Hack: AI Trading Agents 2026** 🎯

*Whale flows + Sentiment divergence + Momentum = Edge*

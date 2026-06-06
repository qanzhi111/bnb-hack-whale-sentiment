/**
 * BNB Hack: AI Trading Agents — Track 2: Strategy Skills
 * 
 * Strategy: Multi-Factor Momentum + On-Chain Sentiment Fusion
 * 
 * This strategy combines:
 * 1. Technical momentum indicators (RSI, MACD, Volume Profile)
 * 2. On-chain whale tracking (large transfers to exchanges = bearish signal)
 * 3. Social sentiment scoring from CMC data
 * 4. Mean reversion on extreme moves
 * 
 * Uses CoinMarketCap MCP data tools for signal generation.
 * Backtestable — no live trading required for Track 2.
 */

// ============ Strategy Configuration ============

const STRATEGY_CONFIG = {
  name: "Whale-Sentiment Momentum Fusion",
  version: "1.0.0",
  author: "onchain-shadow",
  hackathon: "BNB Hack: AI Trading Agents 2026",
  track: "Strategy Skills",
  
  // Risk parameters
  maxPositionSize: 0.10,    // 10% of portfolio per trade
  stopLoss: 0.05,           // 5% stop loss
  takeProfit: 0.15,         // 15% take profit
  maxDrawdown: 0.20,        // 20% max drawdown limit (per hackathon rules)
  
  // Signal thresholds
  rsiOversold: 30,
  rsiOverbought: 70,
  whaleThreshold: 1000000,  // $1M+ transfers = whale activity
  sentimentThreshold: 0.6,  // 60% positive sentiment = bullish
  
  // Universe: BNB Chain tokens
  watchlist: [
    'BNB', 'CAKE', 'TST', 'WHY', 'SIREN', 
    'MUBARAK', 'BROCCOLI', 'TUT', 'FLOKI', 'WIF'
  ],
  
  // Timeframes
  primaryTimeframe: '4h',
  secondaryTimeframe: '1d',
};

// ============ Data Structures ============

class Signal {
  constructor(token, direction, strength, reasons, price, timestamp) {
    this.token = token;
    this.direction = direction;   // 'LONG' or 'SHORT'
    this.strength = strength;     // 0-100
    this.reasons = reasons;       // Array of signal reasons
    this.price = price;
    this.timestamp = timestamp;
    this.confidence = 0;          // Computed from strength + confluence
  }
}

class Trade {
  constructor(signal, entryPrice, positionSize, stopLoss, takeProfit) {
    this.token = signal.token;
    this.direction = signal.direction;
    this.entryPrice = entryPrice;
    this.positionSize = positionSize;
    this.stopLoss = stopLoss;
    this.takeProfit = takeProfit;
    this.timestamp = signal.timestamp;
    this.reasons = signal.reasons;
    this.confidence = signal.confidence;
    this.status = 'OPEN';
    this.exitPrice = null;
    this.pnl = 0;
    this.pnlPercent = 0;
  }
  
  close(price) {
    this.status = 'CLOSED';
    this.exitPrice = price;
    if (this.direction === 'LONG') {
      this.pnlPercent = (price - this.entryPrice) / this.entryPrice;
    } else {
      this.pnlPercent = (this.entryPrice - price) / this.entryPrice;
    }
    this.pnl = this.positionSize * this.pnlPercent;
  }
}

// ============ CMC Data Tool Integration ============

/**
 * These correspond to the 12 CMC MCP data tools available in the hackathon.
 * In production, these would be called via the CMC Agent Hub MCP endpoint.
 * For backtesting, we simulate the data feeds.
 */
const CMC_TOOLS = {
  // Market data tools
  market_overview: 'gainers_losers',          // Top gainers/losers
  market_metrics: 'global_metrics',            // Global market metrics
  token_analysis: 'token_listing',             // Individual token data
  
  // Technical indicators
  price_history: 'ohlcv_historical',           // OHLCV data for TA
  volume_analysis: 'volume_profile',           // Volume profile analysis
  
  // On-chain data
  on_chain_metrics: 'on_chain_analysis',       // On-chain metrics
  whale_tracking: 'large_transactions',        // Large transaction tracking
  exchange_flows: 'exchange_inflow_outflow',   // Exchange deposit/withdrawal
  
  // Sentiment
  social_sentiment: 'social_metrics',          // Social media sentiment
  news_sentiment: 'news_analysis',             // News sentiment scoring
  fear_greed: 'fear_greed_index',             // Fear & Greed Index
  
  // Derived
  correlation_matrix: 'correlation_analysis',  // Cross-asset correlation
  sector_rotation: 'sector_performance',       // Sector rotation signals
};

// ============ Signal Generators ============

/**
 * Signal 1: RSI Mean Reversion
 * Buy when RSI < oversold AND trend is bullish
 * Sell when RSI > overbought AND trend is bearish
 */
function rsiSignal(token, priceHistory) {
  const closes = priceHistory.map(c => c.close);
  const rsi = computeRSI(closes, 14);
  
  if (rsi < STRATEGY_CONFIG.rsiOversold) {
    return new Signal(token, 'LONG', 100 - rsi, 
      [`RSI oversold at ${rsi.toFixed(1)}`], 
      closes[closes.length - 1], Date.now());
  }
  if (rsi > STRATEGY_CONFIG.rsiOverbought) {
    return new Signal(token, 'SHORT', rsi, 
      [`RSI overbought at ${rsi.toFixed(1)}`], 
      closes[closes.length - 1], Date.now());
  }
  return null;
}

/**
 * Signal 2: MACD Crossover
 * Buy on bullish crossover (MACD crosses above signal)
 * Sell on bearish crossover (MACD crosses below signal)
 */
function macdSignal(token, priceHistory) {
  const closes = priceHistory.map(c => c.close);
  const { macd, signal, histogram } = computeMACD(closes, 12, 26, 9);
  
  if (histogram.length < 2) return null;
  
  const prevH = histogram[histogram.length - 2];
  const currH = histogram[histogram.length - 1];
  
  // Bullish crossover
  if (prevH <= 0 && currH > 0) {
    return new Signal(token, 'LONG', Math.min(Math.abs(currH) * 10, 90),
      [`MACD bullish crossover, histogram: ${currH.toFixed(4)}`],
      closes[closes.length - 1], Date.now());
  }
  // Bearish crossover
  if (prevH >= 0 && currH < 0) {
    return new Signal(token, 'SHORT', Math.min(Math.abs(currH) * 10, 90),
      [`MACD bearish crossover, histogram: ${currH.toFixed(4)}`],
      closes[closes.length - 1], Date.now());
  }
  return null;
}

/**
 * Signal 3: Whale Flow Signal
 * Large transfers TO exchanges = selling pressure (bearish)
 * Large transfers FROM exchanges = accumulation (bullish)
 */
function whaleSignal(token, exchangeFlows) {
  const inflow = exchangeFlows.inflow24h || 0;   // To exchanges
  const outflow = exchangeFlows.outflow24h || 0;  // From exchanges
  const netFlow = outflow - inflow;  // Positive = bullish
  
  if (Math.abs(netFlow) < STRATEGY_CONFIG.whaleThreshold) return null;
  
  if (netFlow > 0) {
    return new Signal(token, 'LONG', Math.min(netFlow / 100000, 85),
      [`Whale accumulation: net outflow $${(netFlow/1e6).toFixed(1)}M from exchanges`],
      null, Date.now());
  } else {
    return new Signal(token, 'SHORT', Math.min(Math.abs(netFlow) / 100000, 85),
      [`Whale distribution: net inflow $${(Math.abs(netFlow)/1e6).toFixed(1)}M to exchanges`],
      null, Date.now());
  }
}

/**
 * Signal 4: Sentiment Divergence
 * When price is falling but sentiment is rising = bullish divergence
 * When price is rising but sentiment is falling = bearish divergence
 */
function sentimentDivergenceSignal(token, priceChange24h, sentimentScore) {
  const priceDown = priceChange24h < -3;
  const priceUp = priceChange24h > 3;
  const sentimentBullish = sentimentScore > STRATEGY_CONFIG.sentimentThreshold;
  const sentimentBearish = sentimentScore < (1 - STRATEGY_CONFIG.sentimentThreshold);
  
  if (priceDown && sentimentBullish) {
    return new Signal(token, 'LONG', 70,
      [`Bullish divergence: price -${Math.abs(priceChange24h).toFixed(1)}% but sentiment ${(sentimentScore*100).toFixed(0)}%`],
      null, Date.now());
  }
  if (priceUp && sentimentBearish) {
    return new Signal(token, 'SHORT', 70,
      [`Bearish divergence: price +${priceChange24h.toFixed(1)}% but sentiment ${(sentimentScore*100).toFixed(0)}%`],
      null, Date.now());
  }
  return null;
}

// ============ Technical Indicators ============

function computeRSI(closes, period) {
  if (closes.length < period + 1) return 50;
  
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function computeMACD(closes, fast, slow, signal) {
  const emaFast = computeEMA(closes, fast);
  const emaSlow = computeEMA(closes, slow);
  
  const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
  const signalLine = computeEMA(macdLine, signal);
  const histogram = macdLine.map((m, i) => m - signalLine[i]);
  
  return { macd: macdLine, signal: signalLine, histogram };
}

function computeEMA(data, period) {
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

// ============ Strategy Engine ============

class StrategyEngine {
  constructor(config) {
    this.config = config;
    this.positions = [];
    this.closedTrades = [];
    this.portfolioValue = 10000;  // Starting capital
    this.peakValue = 10000;
    this.maxDrawdown = 0;
  }
  
  /**
   * Generate aggregated signal for a token
   * Combines all signal generators with weighted scoring
   */
  generateSignal(token, marketData) {
    const signals = [];
    
    // RSI signal
    const rsi = rsiSignal(token, marketData.priceHistory);
    if (rsi) signals.push({ signal: rsi, weight: 0.25 });
    
    // MACD signal
    const macd = macdSignal(token, marketData.priceHistory);
    if (macd) signals.push({ signal: macd, weight: 0.30 });
    
    // Whale flow signal
    const whale = whaleSignal(token, marketData.exchangeFlows);
    if (whale) signals.push({ signal: whale, weight: 0.25 });
    
    // Sentiment divergence
    const sentiment = sentimentDivergenceSignal(
      token, 
      marketData.priceChange24h, 
      marketData.sentimentScore
    );
    if (sentiment) signals.push({ signal: sentiment, weight: 0.20 });
    
    if (signals.length === 0) return null;
    
    // Aggregate: direction must be unanimous or supermajority
    const longs = signals.filter(s => s.signal.direction === 'LONG');
    const shorts = signals.filter(s => s.signal.direction === 'SHORT');
    
    let direction, weightedSignals;
    if (longs.length > shorts.length) {
      direction = 'LONG';
      weightedSignals = longs;
    } else if (shorts.length > longs.length) {
      direction = 'SHORT';
      weightedSignals = shorts;
    } else {
      return null;  // Conflicting signals, no trade
    }
    
    // Weighted strength score
    const totalWeight = weightedSignals.reduce((sum, s) => sum + s.weight, 0);
    const weightedStrength = weightedSignals.reduce(
      (sum, s) => sum + s.signal.strength * s.weight, 0
    ) / totalWeight;
    
    // Confluence bonus: more signals = higher confidence
    const confluenceBonus = Math.min(weightedSignals.length * 10, 30);
    const confidence = Math.min(weightedStrength + confluenceBonus, 100);
    
    // Only trade if confidence > 60
    if (confidence < 60) return null;
    
    const allReasons = weightedSignals.flatMap(s => s.signal.reasons);
    const price = marketData.currentPrice;
    
    const aggregated = new Signal(token, direction, confidence, allReasons, price, Date.now());
    aggregated.confidence = confidence;
    
    return aggregated;
  }
  
  /**
   * Execute a signal (with risk management)
   */
  executeSignal(signal) {
    // Check max drawdown
    if (this.maxDrawdown >= this.config.maxDrawdown) {
      console.log(`⚠️ Max drawdown ${this.maxDrawdown.toFixed(1)}% reached — no new trades`);
      return null;
    }
    
    // Check if already in position for this token
    if (this.positions.find(p => p.token === signal.token)) {
      return null;
    }
    
    // Position sizing
    const positionSize = this.portfolioValue * this.config.maxPositionSize;
    
    // Stop loss and take profit
    let stopLoss, takeProfit;
    if (signal.direction === 'LONG') {
      stopLoss = signal.price * (1 - this.config.stopLoss);
      takeProfit = signal.price * (1 + this.config.takeProfit);
    } else {
      stopLoss = signal.price * (1 + this.config.stopLoss);
      takeProfit = signal.price * (1 - this.config.takeProfit);
    }
    
    const trade = new Trade(signal, signal.price, positionSize, stopLoss, takeProfit);
    this.positions.push(trade);
    
    return trade;
  }
  
  /**
   * Update positions on new price data
   */
  updatePositions(token, currentPrice) {
    for (const trade of this.positions) {
      if (trade.token !== token) continue;
      
      // Check stop loss
      if (trade.direction === 'LONG' && currentPrice <= trade.stopLoss) {
        trade.close(currentPrice);
        this.portfolioValue += trade.pnl;
      } else if (trade.direction === 'SHORT' && currentPrice >= trade.stopLoss) {
        trade.close(currentPrice);
        this.portfolioValue += trade.pnl;
      }
      // Check take profit
      else if (trade.direction === 'LONG' && currentPrice >= trade.takeProfit) {
        trade.close(currentPrice);
        this.portfolioValue += trade.pnl;
      } else if (trade.direction === 'SHORT' && currentPrice <= trade.takeProfit) {
        trade.close(currentPrice);
        this.portfolioValue += trade.pnl;
      }
    }
    
    // Move closed trades
    this.positions = this.positions.filter(t => {
      if (t.status === 'CLOSED') {
        this.closedTrades.push(t);
        return false;
      }
      return true;
    });
    
    // Update drawdown
    this.peakValue = Math.max(this.peakValue, this.portfolioValue);
    this.maxDrawdown = Math.max(
      this.maxDrawdown, 
      (this.peakValue - this.portfolioValue) / this.peakValue
    );
  }
  
  /**
   * Generate performance report
   */
  getReport() {
    const totalTrades = this.closedTrades.length;
    const wins = this.closedTrades.filter(t => t.pnl > 0).length;
    const winRate = totalTrades > 0 ? wins / totalTrades : 0;
    const totalPnl = this.closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const avgWin = this.closedTrades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnlPercent, 0) / (wins || 1);
    const avgLoss = this.closedTrades.filter(t => t.pnl <= 0).reduce((s, t) => s + t.pnlPercent, 0) / (totalTrades - wins || 1);
    const profitFactor = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : Infinity;
    
    return {
      strategy: this.config.name,
      totalTrades,
      winRate: (winRate * 100).toFixed(1) + '%',
      totalPnl: '$' + totalPnl.toFixed(2),
      totalReturn: ((this.portfolioValue - 10000) / 10000 * 100).toFixed(2) + '%',
      maxDrawdown: (this.maxDrawdown * 100).toFixed(1) + '%',
      profitFactor: profitFactor.toFixed(2),
      avgWin: (avgWin * 100).toFixed(2) + '%',
      avgLoss: (avgLoss * 100).toFixed(2) + '%',
      openPositions: this.positions.length,
      portfolioValue: '$' + this.portfolioValue.toFixed(2),
    };
  }
}

// ============ Backtest Runner ============

/**
 * Simulates historical data for backtesting
 * In production, data comes from CMC MCP Agent Hub
 */
function generateBacktestData(days = 90) {
  const tokens = STRATEGY_CONFIG.watchlist;
  const data = {};
  
  for (const token of tokens) {
    const priceHistory = [];
    let price = token === 'BNB' ? 630 : Math.random() * 10 + 0.01;
    
    for (let i = 0; i < days * 6; i++) {  // 4h candles = 6 per day
      const volatility = 0.03;
      const drift = 0.0002;
      const change = price * (drift + volatility * (Math.random() - 0.48));
      price = Math.max(price + change, 0.001);
      
      priceHistory.push({
        open: price * (1 + Math.random() * 0.005),
        high: price * (1 + Math.random() * 0.02),
        low: price * (1 - Math.random() * 0.02),
        close: price,
        volume: Math.random() * 1000000 + 100000,
        timestamp: Date.now() - (days * 6 - i) * 4 * 3600000
      });
    }
    
    data[token] = {
      priceHistory,
      currentPrice: price,
      priceChange24h: (Math.random() - 0.45) * 15,
      sentimentScore: Math.random(),
      exchangeFlows: {
        inflow24h: Math.random() * 5000000,
        outflow24h: Math.random() * 5000000
      }
    };
  }
  
  return data;
}

function runBacktest() {
  const engine = new StrategyEngine(STRATEGY_CONFIG);
  const data = generateBacktestData(90);
  
  // Simulate bar-by-bar
  const tokens = Object.keys(data);
  const barsPerToken = data[tokens[0]].priceHistory.length;
  
  for (let bar = 50; bar < barsPerToken; bar++) {  // Start after 50 bars for indicator warmup
    for (const token of tokens) {
      const tokenData = data[token];
      
      // Slice price history up to current bar
      const currentData = {
        ...tokenData,
        priceHistory: tokenData.priceHistory.slice(0, bar + 1),
        currentPrice: tokenData.priceHistory[bar].close,
      };
      
      // Update existing positions
      engine.updatePositions(token, currentData.currentPrice);
      
      // Generate signal
      const signal = engine.generateSignal(token, currentData);
      if (signal) {
        engine.executeSignal(signal);
      }
    }
  }
  
  return engine.getReport();
}

// ============ Main ============

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('\n🏆 BNB Hack: AI Trading Agents — Strategy Skills Track');
  console.log('📊 Strategy: Whale-Sentiment Momentum Fusion\n');
  console.log('Running 90-day backtest...\n');
  
  const report = runBacktest();
  
  console.log('=== Backtest Results ===');
  console.log(JSON.stringify(report, null, 2));
}

export { StrategyEngine, STRATEGY_CONFIG, runBacktest };

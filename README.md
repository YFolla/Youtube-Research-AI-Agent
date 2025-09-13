# YouTube AI Agent

**@fileoverview** An intelligent command-line tool that analyzes YouTube channels using AI-powered insights to help content creators optimize their video strategy and performance.

## 🎯 What This Tool Does

The YouTube AI Agent is a sophisticated content analysis tool that:

- **Analyzes Channel Performance**: Fetches and examines the 20 most recent videos from any YouTube channel
- **Generates AI-Powered Insights**: Uses advanced algorithms to identify performance patterns, content themes, and optimization opportunities  
- **Provides Actionable Recommendations**: Suggests specific video title ideas and content strategies based on top-performing videos
- **Supports Batch Processing**: Can analyze multiple channels at once from a predefined list
- **Creates Detailed Reports**: Outputs both console summaries and comprehensive markdown reports

### Key Features

🔍 **Smart Channel Analysis**
- Fetches recent video data using YouTube Data API v3
- Analyzes view counts, video duration, publish dates, and title patterns
- Identifies top 10 performing videos by engagement

🧠 **AI-Powered Content Insights**
- Detects successful content themes and keywords
- Analyzes title structures that drive higher views
- Identifies optimal video length and publishing patterns
- Recognizes underperforming content areas

💡 **Actionable Recommendations**
- Generates 3 AI-suggested video title ideas based on successful patterns
- Provides a "Success Formula" summarizing what works for each channel
- Offers specific optimization opportunities
- Suggests content gaps to explore

📊 **Comprehensive Reporting**
- Beautiful console output with emojis and formatting
- Detailed markdown reports for documentation
- Batch analysis summaries across multiple channels
- Individual channel reports with performance metrics

## 🚀 Quick Start

### 1. Get a YouTube API Key
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing one
- Enable **YouTube Data API v3**
- Create credentials (API Key)

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Environment
```bash
cp .env.example .env
# Edit .env and add: YOUTUBE_API_KEY=your_api_key_here
```

## 📖 Usage

### Single Channel Analysis
```bash
node index.js "/youtube @channelname"
```

**Examples:**
```bash
node index.js "/youtube @mkbhd"          # Tech reviews
node index.js "/youtube @veritasium"     # Educational content  
node index.js "/youtube @3blue1brown"   # Math/Science
```

### Batch Analysis Mode
```bash
node index.js "/youtube"
```

This processes all channels listed in `youtube-channels.md`. Create the file with this format:

```markdown
# YouTube Channels to Analyze

## Tech Channels
- @mkbhd - Marques Brownlee
- @PeterYangYT - Peter Yang

## Educational  
- @3Blue1Brown - Grant Sanderson
- @CodeBullet - Code Bullet
```

## 📈 Sample Output

```
🎥 YouTube Channel Analysis: Marques Brownlee
📊 Analyzed 20 recent videos • 18.2M subscribers  
📅 Analysis generated on March 15, 2024 at 2:30 PM

🔍 KEY INSIGHTS

📈 Performance Patterns:
• Top videos average 2.1M views vs 800K channel average (+162%)
• Videos 8-12 minutes long perform 40% better than shorter content

🎯 Content Themes:  
• Tech reviews dominate top performers (70% of high-view videos)
• "First Look", "Review", and "vs" are high-performing title keywords

📊 Optimization Opportunities:
• Consider more comparison content ("X vs Y" format)
• Tutorial-style content underperforms - focus on reviews

💡 YOUR NEXT VIDEO

Based on your top performers, consider these title ideas:
1. "iPhone 16 vs Galaxy S24: The Real Winner After 30 Days"
2. "I Used Tesla's New Update for a Week - Here's What Changed"  
3. "First Look: The Laptop That Could Kill MacBooks"

💯 Success Formula: Tech reviews with clear comparisons, 8-12 min duration
```

## 🗂️ Generated Reports

### Console Output
- Real-time analysis progress with emojis
- Formatted performance insights
- Top 10 videos with clickable links
- AI-generated content recommendations

### Markdown Files
- `youtube-research.md` - Single channel detailed report
- `youtube-{channelname}-report.md` - Individual channel reports (batch mode)
- `youtube-batch-report.md` - Cross-channel summary analysis

## ⚡ API Usage & Limits

**Quota per Analysis:** ~106 units
- Channel search: 100 units
- Channel info: 1 unit
- Playlist items: 1 unit  
- Video details: 1 unit

**Daily Limits:**
- Free tier: 10,000 units (≈94 analyses/day)
- Paid tier: Up to 1M units/day

## 🛠️ Technical Architecture

- **Runtime**: Node.js with ES modules
- **API Integration**: YouTube Data API v3 via Axios
- **Data Processing**: Advanced statistical analysis and pattern recognition
- **Output**: Structured console logs and markdown file generation
- **Error Handling**: Graceful degradation with retry logic

## 🎨 AI-Powered Features

The tool uses sophisticated algorithms to:
- **Pattern Recognition**: Identifies successful content structures and themes
- **Keyword Analysis**: Extracts high-performing words and phrases from titles
- **Performance Correlation**: Links video characteristics to view count success
- **Recommendation Engine**: Generates contextual title suggestions based on channel data
- **Trend Analysis**: Detects publishing patterns and optimal content timing

## 🔧 Advanced Usage

### Environment Variables
```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Error Handling
- Invalid channels: Graceful skip with error logging
- API limits: Automatic retry with exponential backoff
- Network issues: Comprehensive error messages
- Missing files: Clear setup instructions

## 📝 Use Cases

**Content Creators**: Optimize video strategy based on data-driven insights
**Marketing Teams**: Analyze competitor channels and identify content gaps  
**Agencies**: Batch analyze client channels for comprehensive reporting
**Researchers**: Study YouTube content patterns and performance metrics
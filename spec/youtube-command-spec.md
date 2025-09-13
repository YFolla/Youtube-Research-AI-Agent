# YouTube Command Specification

## Overview
A custom `/youtube` slash command that analyzes YouTube channels and provides actionable insights for content creators.

## Command Format
```
/youtube @channelname    # Analyze single channel
/youtube                 # Batch process all channels in youtube-channels.md
```

## Behavior

### Single Channel Analysis
1. Fetches the 20 most recent videos from the specified channel
2. Analyzes video performance metrics (views, duration, titles)
3. Identifies top 10 performing videos by view count
4. Generates performance insights and content recommendations
5. Outputs formatted results to console

### Batch Processing Mode
1. Checks for `youtube-channels.md` file in current directory
2. Parses channel list from the markdown file
3. Processes each channel sequentially with individual analysis
4. Generates combined summary report with cross-channel insights
5. Creates individual reports for each channel

## Data Collection
- **Source**: YouTube Data API v3
- **Video Count**: 20 most recent uploads
- **Metrics**: Title, URL, view count, duration, publish date
- **Analysis**: Performance patterns, title optimization, content themes

## Output Format

### Header Section
```
🎥 YouTube Channel Analysis: [Channel Name]
📊 Analyzed [X] recent videos • [Subscriber Count] subscribers
📅 Analysis generated on [Date/Time]
```

### Key Insights Section
```
🔍 KEY INSIGHTS

📈 Performance Patterns:
• [Insight about view count distribution]
• [Insight about content timing/frequency]
• [Insight about video length correlation]

🎯 Content Themes:
• [Most successful content categories]
• [Common keywords in top performers]
• [Audience engagement patterns]

📊 Optimization Opportunities:
• [Specific recommendations based on data]
• [Title/thumbnail suggestions]
• [Content gap analysis]
```

### Video Recommendations Section
```
💡 YOUR NEXT VIDEO

Based on your top performers, consider these title ideas:
1. "[AI-generated title suggestion based on successful patterns]"
2. "[AI-generated title suggestion with trending keywords]"
3. "[AI-generated title suggestion combining top themes]"

💯 Success Formula: [Summary of what makes videos perform well on this channel]
```

### Top Videos Section
```
🏆 TOP 10 VIDEOS BY VIEWS

 1. [Video Title](https://youtube.com/watch?v=VIDEO_ID)
    👀 [X,XXX,XXX] views • ⏱️ [XX:XX] • 📅 [Date]

 2. [Video Title](https://youtube.com/watch?v=VIDEO_ID)
    👀 [X,XXX,XXX] views • ⏱️ [XX:XX] • 📅 [Date]

[... continues for all 10 videos]
```

## Technical Requirements

### API Integration
- YouTube Data API v3 with valid API key
- Channel search and video listing endpoints
- Video statistics and content details retrieval

### Data Processing
- Sort videos by view count (descending)
- Extract duration from ISO 8601 format (PT#M#S → MM:SS)
- Format large numbers with comma separators
- Generate clickable YouTube URLs

### Insights Generation
- Statistical analysis of view count distribution
- Title keyword frequency analysis
- Content category pattern recognition  
- Performance correlation identification
- AI-powered recommendation generation

### Batch Processing File Format
The `youtube-channels.md` file should contain a list of YouTube channels in this format:

```markdown
# YouTube Channels to Analyze

## Tech Channels
- @mkbhd - Marques Brownlee
- @PeterYangYT - Peter Yang  
- @TheoMcP - Theo McP

## Educational
- @3Blue1Brown - Grant Sanderson
- @CodeBullet - Code Bullet

## Optional: Tags for grouping
#tech #education #productivity
```

### Error Handling
- Invalid channel names → clear error message, continue with next channel
- API quota exceeded → graceful degradation with partial results
- Network failures → retry with exponential backoff
- Missing video data → skip and continue processing
- Missing youtube-channels.md → clear error message with file format example

## Example Output

```
🎥 YouTube Channel Analysis: Marques Brownlee
📊 Analyzed 20 recent videos • 18.2M subscribers
📅 Analysis generated on March 15, 2024 at 2:30 PM

🔍 KEY INSIGHTS

📈 Performance Patterns:
• Top videos average 2.1M views vs 800K channel average (+162%)
• Videos 8-12 minutes long perform 40% better than shorter content
• Tuesday/Wednesday uploads get 25% more engagement

🎯 Content Themes:
• Tech reviews dominate top performers (70% of high-view videos)
• "First Look", "Review", and "vs" are high-performing title keywords
• Apple and Tesla content consistently outperforms other brands

📊 Optimization Opportunities:
• Consider more comparison content ("X vs Y" format)
• Leverage seasonal tech events (CES, WWDC) for higher reach
• Tutorial-style content underperforms - focus on reviews/first impressions

💡 YOUR NEXT VIDEO

Based on your top performers, consider these title ideas:
1. "iPhone 16 vs Galaxy S24: The Real Winner After 30 Days"
2. "I Used Tesla's New Update for a Week - Here's What Changed"
3. "First Look: The Laptop That Could Kill MacBooks"

💯 Success Formula: Tech reviews with clear comparisons, posted mid-week, 8-12 min duration

🏆 TOP 10 VIDEOS BY VIEWS

 1. [iPhone 15 Pro Max Review: Heavy Hitter!](https://youtube.com/watch?v=abc123)
    👀 8,234,567 views • ⏱️ 11:23 • 📅 Sep 22, 2023

 2. [Tesla Cybertruck: Everything We Know](https://youtube.com/watch?v=def456)
    👀 6,891,234 views • ⏱️ 13:45 • 📅 Oct 5, 2023

 3. [M3 MacBook Air vs M2: Worth the Upgrade?](https://youtube.com/watch?v=ghi789)
    👀 5,567,890 views • ⏱️ 9:32 • 📅 Nov 12, 2023

[... continues for all 10 videos]
```

## Success Metrics
- Command executes in under 10 seconds
- Provides actionable insights for content strategy
- Generates relevant, data-driven video title suggestions
- Formats output for easy readability and link access
- Handles edge cases gracefully without breaking
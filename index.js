#!/usr/bin/env node

import { config } from 'dotenv';
import axios from 'axios';
import fs from 'fs/promises';

config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

class YouTubeAgent {
  constructor() {
    if (!YOUTUBE_API_KEY) {
      console.error('Error: YOUTUBE_API_KEY not found in environment variables');
      console.error('Please create a .env file with your YouTube API key');
      process.exit(1);
    }
  }

  parseCommand(input) {
    const batchMatch = input.match(/^\/youtube\s*$/);
    if (batchMatch) {
      return null; // Indicates batch processing mode
    }
    
    const singleMatch = input.match(/^\/youtube\s+@?(.+)$/);
    if (!singleMatch) {
      throw new Error('Invalid command format. Use: /youtube @channelname or /youtube for batch processing');
    }
    return singleMatch[1].trim();
  }

  async getChannelId(channelName) {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: {
          key: YOUTUBE_API_KEY,
          q: channelName,
          type: 'channel',
          part: 'snippet',
          maxResults: 1
        }
      });

      if (response.data.items.length === 0) {
        throw new Error(`Channel "${channelName}" not found`);
      }

      return response.data.items[0].snippet.channelId;
    } catch (error) {
      throw new Error(`Failed to find channel: ${error.message}`);
    }
  }

  async getChannelInfo(channelId) {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        params: {
          key: YOUTUBE_API_KEY,
          id: channelId,
          part: 'snippet,contentDetails,statistics'
        }
      });

      if (response.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      return response.data.items[0];
    } catch (error) {
      throw new Error(`Failed to get channel info: ${error.message}`);
    }
  }

  async getChannelVideos(uploadsPlaylistId, maxResults = 20) {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
        params: {
          key: YOUTUBE_API_KEY,
          playlistId: uploadsPlaylistId,
          part: 'snippet',
          maxResults: maxResults,
          order: 'date'
        }
      });

      const videoIds = response.data.items.map(item => item.snippet.resourceId.videoId);
      
      // Get video statistics and content details (including duration)
      const videoStatsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
          key: YOUTUBE_API_KEY,
          id: videoIds.join(','),
          part: 'statistics,snippet,contentDetails'
        }
      });

      return videoStatsResponse.data.items
        .map(video => ({
          title: video.snippet.title,
          videoId: video.id,
          url: `https://youtube.com/watch?v=${video.id}`,
          views: parseInt(video.statistics.viewCount) || 0,
          likes: parseInt(video.statistics.likeCount) || 0,
          publishedAt: video.snippet.publishedAt,
          duration: this.parseDuration(video.contentDetails.duration),
          thumbnail: video.snippet.thumbnails.medium?.url
        }))
        .filter(video => video.views > 0); // Filter out videos with no view data
    } catch (error) {
      throw new Error(`Failed to get channel videos: ${error.message}`);
    }
  }

  parseDuration(isoDuration) {
    // Parse ISO 8601 duration (PT#H#M#S) to MM:SS format
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    const totalMinutes = hours * 60 + minutes;
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    return `${totalMinutes}:${formattedSeconds}`;
  }

  generateAdvancedInsights(videos, channelInfo) {
    const sortedByViews = [...videos].sort((a, b) => b.views - a.views);
    const topVideos = sortedByViews.slice(0, 10);
    const avgViews = Math.round(videos.reduce((sum, v) => sum + v.views, 0) / videos.length);
    const topAvgViews = Math.round(topVideos.reduce((sum, v) => sum + v.views, 0) / topVideos.length);
    
    // Duration analysis
    const durations = videos.map(v => {
      const [min, sec] = v.duration.split(':').map(Number);
      return min + sec / 60;
    }).filter(d => d > 0);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    // Analyze titles for patterns
    const titleWords = videos.flatMap(v => 
      v.title.toLowerCase().split(/\s+/).filter(word => word.length > 3 && !/^\d+$/.test(word))
    );
    const wordFreq = {};
    titleWords.forEach(word => wordFreq[word] = (wordFreq[word] || 0) + 1);
    const commonWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .filter(([,count]) => count >= 2)
      .map(([word]) => word);

    // Performance patterns
    const performancePatterns = [];
    if (topAvgViews > avgViews) {
      const improvement = Math.round(((topAvgViews / avgViews) - 1) * 100);
      performancePatterns.push(`Top videos average ${this.formatNumber(topAvgViews)} views vs ${this.formatNumber(avgViews)} channel average (+${improvement}%)`);
    }
    
    if (avgDuration > 0) {
      const optimalRange = Math.round(avgDuration);
      performancePatterns.push(`Videos around ${optimalRange} minutes tend to perform well for this channel`);
    }
    
    // Publishing patterns (simplified)
    const recentUploads = videos.filter(v => {
      const uploadDate = new Date(v.publishedAt);
      const daysSinceUpload = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpload <= 30;
    });
    if (recentUploads.length >= 3) {
      performancePatterns.push(`Recent upload frequency: ${recentUploads.length} videos in the last 30 days`);
    }

    // Content themes
    const contentThemes = [];
    if (commonWords.length > 0) {
      contentThemes.push(`Most successful content includes: "${commonWords.slice(0, 5).join('", "')}"`);
    }
    
    // High-performing keywords from top videos
    const topVideoWords = topVideos.flatMap(v => 
      v.title.toLowerCase().split(/\s+/).filter(word => word.length > 3)
    );
    const topWordFreq = {};
    topVideoWords.forEach(word => topWordFreq[word] = (topWordFreq[word] || 0) + 1);
    const topKeywords = Object.entries(topWordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .filter(([,count]) => count >= 2)
      .map(([word]) => word);
    
    if (topKeywords.length > 0) {
      contentThemes.push(`High-performing keywords: "${topKeywords.join('", "')}"`); 
    }

    // Optimization opportunities
    const optimizationOpportunities = [];
    
    if (sortedByViews[0].views > avgViews * 5) {
      optimizationOpportunities.push(`Consider replicating elements from your top video (${sortedByViews[0].title.substring(0, 50)}...)`);
    }
    
    if (videos.length >= 10) {
      const underperformers = sortedByViews.slice(-5).filter(v => v.views < avgViews * 0.5);
      if (underperformers.length >= 3) {
        optimizationOpportunities.push(`${underperformers.length} recent videos underperformed - consider analyzing successful patterns`);
      }
    }
    
    if (commonWords.includes('tutorial') || commonWords.includes('how')) {
      optimizationOpportunities.push(`Tutorial content detected - ensure clear value proposition in titles`);
    }

    return {
      performancePatterns,
      contentThemes,
      optimizationOpportunities,
      avgViews,
      topVideos
    };
  }

  generateContentRecommendations(videos, insights) {
    const { topVideos, contentThemes } = insights;
    const recommendations = [];
    
    // Extract successful patterns from top videos
    const topTitles = topVideos.slice(0, 5).map(v => v.title);
    const patterns = [];
    
    // Look for common structures
    if (topTitles.some(t => t.includes(' vs ') || t.includes(' VS '))) {
      patterns.push('comparison');
    }
    if (topTitles.some(t => t.toLowerCase().includes('review'))) {
      patterns.push('review');
    }
    if (topTitles.some(t => t.toLowerCase().includes('first') || t.toLowerCase().includes('new'))) {
      patterns.push('first-look');
    }
    if (topTitles.some(t => t.includes('!')  || t.includes('?'))) {
      patterns.push('engaging-punctuation');
    }
    
    // Generate recommendations based on patterns
    const titleTemplates = {
      comparison: [
        '[Popular Topic A] vs [Popular Topic B]: The Real Winner',
        'I Tried [Topic A] and [Topic B] for 30 Days - Here\'s What Happened',
        '[Topic A] vs [Topic B]: Which Should You Choose in 2024?'
      ],
      review: [
        '[New Product/Service]: Everything You Need to Know',
        'I Used [Product] for [Time Period] - Honest Review', 
        '[Product] Review: Worth the Hype?'
      ],
      'first-look': [
        'First Look: [Trending Topic] Changes Everything',
        'I Got Early Access to [New Thing] - Here\'s My Take',
        '[New Release]: First Impressions After 24 Hours'
      ]
    };
    
    // Select templates based on detected patterns
    patterns.forEach(pattern => {
      if (titleTemplates[pattern] && recommendations.length < 3) {
        recommendations.push(titleTemplates[pattern][0]);
      }
    });
    
    // Fill remaining slots with generic successful patterns
    while (recommendations.length < 3) {
      const generic = [
        'Why Everyone is Talking About [Trending Topic]',
        'The Truth About [Popular Subject] No One Tells You',
        'I Spent [Time Period] Testing [Topic] - Results Will Surprise You'
      ];
      recommendations.push(generic[recommendations.length]);
    }
    
    // Generate success formula
    let successFormula = 'Focus on ';
    if (patterns.includes('comparison')) successFormula += 'comparison content, ';
    if (patterns.includes('review')) successFormula += 'honest reviews, ';
    if (patterns.includes('first-look')) successFormula += 'trending/new topics, ';
    
    successFormula += `maintain ${Math.round(videos.reduce((sum, v) => {
      const [min] = v.duration.split(':').map(Number);
      return sum + min;
    }, 0) / videos.length)}-minute videos`;
    
    return {
      recommendations,
      successFormula: successFormula.replace(', maintain', ' and maintain')
    };
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  displayConsoleReport(channelName, channelInfo, videos, insights, recommendations) {
    const timestamp = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
    const subscriberCount = parseInt(channelInfo.statistics.subscriberCount).toLocaleString();
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎥 YouTube Channel Analysis: ${channelInfo.snippet.title}`);
    console.log(`📊 Analyzed ${videos.length} recent videos • ${subscriberCount} subscribers`);
    console.log(`📅 Analysis generated on ${timestamp}`);
    console.log('='.repeat(60));
    
    console.log('\n🔍 KEY INSIGHTS\n');
    
    console.log('📈 Performance Patterns:');
    insights.performancePatterns.forEach(pattern => {
      console.log(`• ${pattern}`);
    });
    
    console.log('\n🎯 Content Themes:');
    insights.contentThemes.forEach(theme => {
      console.log(`• ${theme}`);
    });
    
    console.log('\n📊 Optimization Opportunities:');
    insights.optimizationOpportunities.forEach(opportunity => {
      console.log(`• ${opportunity}`);
    });
    
    console.log('\n💡 YOUR NEXT VIDEO\n');
    console.log('Based on your top performers, consider these title ideas:');
    recommendations.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. "${rec}"`);
    });
    
    console.log(`\n💯 Success Formula: ${recommendations.successFormula}`);
    
    console.log('\n🏆 TOP 10 VIDEOS BY VIEWS\n');
    insights.topVideos.forEach((video, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${video.title}`);
      console.log(`    👀 ${this.formatNumber(video.views)} views • ⏱️ ${video.duration} • 📅 ${new Date(video.publishedAt).toLocaleDateString()}`);
      console.log(`    🔗 ${video.url}\n`);
    });
  }

  async generateMarkdownReport(channelName, channelInfo, videos, insights, recommendations, filename = 'youtube-research.md') {
    const sortedVideos = [...videos].sort((a, b) => b.views - a.views);
    const timestamp = new Date().toLocaleString();
    
    let markdown = `# YouTube Channel Analysis: ${channelInfo.snippet.title}\n\n`;
    markdown += `**Analysis Date:** ${timestamp}\n`;
    markdown += `**Channel:** @${channelName}\n`;
    markdown += `**Subscribers:** ${parseInt(channelInfo.statistics.subscriberCount).toLocaleString()}\n`;
    markdown += `**Total Videos:** ${parseInt(channelInfo.statistics.videoCount).toLocaleString()}\n\n`;

    markdown += `## Top Recent Videos\n\n`;
    sortedVideos.forEach((video, index) => {
      markdown += `### ${index + 1}. ${video.title}\n`;
      markdown += `- **Views:** ${video.views.toLocaleString()}\n`;
      markdown += `- **Duration:** ${video.duration}\n`;
      markdown += `- **Link:** ${video.url}\n`;
      markdown += `- **Published:** ${new Date(video.publishedAt).toLocaleDateString()}\n\n`;
    });

    markdown += `## Performance Patterns\n\n`;
    insights.performancePatterns.forEach(pattern => {
      markdown += `- ${pattern}\n`;
    });
    
    markdown += `\n## Content Themes\n\n`;
    insights.contentThemes.forEach(theme => {
      markdown += `- ${theme}\n`;
    });
    
    markdown += `\n## Optimization Opportunities\n\n`;
    insights.optimizationOpportunities.forEach(opportunity => {
      markdown += `- ${opportunity}\n`;
    });
    
    markdown += `\n## Content Recommendations\n\n`;
    recommendations.recommendations.forEach((rec, index) => {
      markdown += `${index + 1}. "${rec}"\n`;
    });
    markdown += `\n**Success Formula:** ${recommendations.successFormula}\n`;

    markdown += `\n---\n*Generated by YouTube AI Agent*`;

    await fs.writeFile(filename, markdown);
    return filename;
  }

  async parseChannelsFile() {
    try {
      const content = await fs.readFile('youtube-channels.md', 'utf-8');
      const lines = content.split('\n');
      const channels = [];
      
      for (const line of lines) {
        // Match lines like "- @channelname - Description"
        const match = line.match(/^\s*-\s*@?([^\s-]+)(?:\s*-\s*(.*))?$/);
        if (match) {
          channels.push({
            handle: match[1],
            description: match[2] || match[1]
          });
        }
      }
      
      return channels;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`youtube-channels.md not found. Create a file with this format:

# YouTube Channels to Analyze

## Tech Channels  
- @mkbhd - Marques Brownlee
- @PeterYangYT - Peter Yang

## Educational
- @3Blue1Brown - Grant Sanderson`);
      }
      throw error;
    }
  }

  async analyzeSingleChannel(channelName, isQuiet = false) {
    if (!isQuiet) console.log(`🔍 Finding channel: @${channelName}...`);
    const channelId = await this.getChannelId(channelName);
    
    if (!isQuiet) console.log('📊 Getting channel info...');
    const channelInfo = await this.getChannelInfo(channelId);
    const uploadsPlaylistId = channelInfo.contentDetails.relatedPlaylists.uploads;
    
    if (!isQuiet) console.log('📹 Fetching recent videos...');
    const videos = await this.getChannelVideos(uploadsPlaylistId);
    
    if (!isQuiet) console.log('🧠 Generating insights...');
    const insights = this.generateAdvancedInsights(videos, channelInfo);
    
    if (!isQuiet) console.log('💡 Creating recommendations...');
    const recommendations = this.generateContentRecommendations(videos, insights);
    
    return { channelName, channelInfo, videos, insights, recommendations };
  }

  async batchAnalyzeChannels() {
    const startTime = Date.now();
    
    try {
      console.log('📋 Loading channels from youtube-channels.md...');
      const channels = await this.parseChannelsFile();
      console.log(`📊 Found ${channels.length} channels to analyze\n`);
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        console.log(`\n[${i + 1}/${channels.length}] Analyzing @${channel.handle}...`);
        
        try {
          const result = await this.analyzeSingleChannel(channel.handle, true);
          results.push(result);
          console.log(`✅ @${channel.handle} complete`);
        } catch (error) {
          console.log(`❌ @${channel.handle} failed: ${error.message}`);
          errors.push({ channel: channel.handle, error: error.message });
        }
      }
      
      // Generate batch report
      console.log('\n📝 Generating batch report...');
      await this.generateBatchReport(results, errors);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✅ Batch analysis complete in ${duration}s!`);
      console.log(`📊 Successfully analyzed ${results.length}/${channels.length} channels`);
      if (errors.length > 0) {
        console.log(`⚠️  ${errors.length} channels failed`);
      }
      
    } catch (error) {
      console.error(`❌ Batch processing failed: ${error.message}`);
      process.exit(1);
    }
  }

  async generateBatchReport(results, errors) {
    const timestamp = new Date().toLocaleString();
    
    let markdown = `# YouTube Batch Analysis Report\n\n`;
    markdown += `**Analysis Date:** ${timestamp}\n`;
    markdown += `**Channels Analyzed:** ${results.length}\n`;
    markdown += `**Channels Failed:** ${errors.length}\n\n`;
    
    // Summary statistics
    if (results.length > 0) {
      const totalSubscribers = results.reduce((sum, r) => sum + parseInt(r.channelInfo.statistics.subscriberCount), 0);
      const avgViews = results.reduce((sum, r) => sum + r.insights.avgViews, 0) / results.length;
      
      markdown += `## Summary Statistics\n\n`;
      markdown += `- **Total Subscribers:** ${totalSubscribers.toLocaleString()}\n`;
      markdown += `- **Average Views per Video:** ${Math.round(avgViews).toLocaleString()}\n`;
      markdown += `- **Total Videos Analyzed:** ${results.reduce((sum, r) => sum + r.videos.length, 0)}\n\n`;
    }
    
    // Individual channel reports
    markdown += `## Channel Reports\n\n`;
    for (const result of results) {
      markdown += `### ${result.channelInfo.snippet.title}\n`;
      markdown += `- **Handle:** @${result.channelName}\n`;
      markdown += `- **Subscribers:** ${parseInt(result.channelInfo.statistics.subscriberCount).toLocaleString()}\n`;
      markdown += `- **Avg Views:** ${Math.round(result.insights.avgViews).toLocaleString()}\n`;
      markdown += `- **Top Video:** ${result.insights.topVideos[0].title} (${this.formatNumber(result.insights.topVideos[0].views)} views)\n\n`;
    }
    
    // Errors
    if (errors.length > 0) {
      markdown += `## Failed Channels\n\n`;
      for (const error of errors) {
        markdown += `- **@${error.channel}:** ${error.error}\n`;
      }
      markdown += `\n`;
    }
    
    markdown += `---\n*Generated by YouTube AI Agent - Batch Mode*`;
    
    await fs.writeFile('youtube-batch-report.md', markdown);
    console.log('📄 Batch report saved to youtube-batch-report.md');
    
    // Also generate individual reports
    for (const result of results) {
      const filename = `youtube-${result.channelName}-report.md`;
      await this.generateMarkdownReport(result.channelName, result.channelInfo, result.videos, result.insights, result.recommendations, filename);
    }
    console.log(`📁 Individual reports saved for ${results.length} channels`);
  }

  async analyzeChannel(input) {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Parsing command...');
      const channelName = this.parseCommand(input);
      
      // Check if batch processing mode
      if (channelName === null) {
        return await this.batchAnalyzeChannels();
      }
      
      // Single channel analysis
      const result = await this.analyzeSingleChannel(channelName);
      
      // Display console report
      this.displayConsoleReport(result.channelName, result.channelInfo, result.videos, result.insights, result.recommendations);
      
      console.log('📝 Creating markdown report...');
      const filename = await this.generateMarkdownReport(result.channelName, result.channelInfo, result.videos, result.insights, result.recommendations);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✅ Analysis complete in ${duration}s! Report saved to ${filename}`);
      
      return filename;
    } catch (error) {
      await this.handleError(error);
    }
  }

  async handleError(error, retryCount = 0) {
    console.error(`❌ Error: ${error.message}`);
    
    // Check if it's a rate limit error and we haven't retried too many times
    if (error.response?.status === 403 && retryCount < 2) {
      console.log(`⏳ Rate limit hit, waiting ${(retryCount + 1) * 2} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
      return; // Let the calling function handle retry
    }
    
    if (error.response?.status === 404) {
      console.error('Channel not found. Please check the channel name and try again.');
    } else if (error.response?.status === 403) {
      console.error('API quota exceeded or invalid API key. Please check your YOUTUBE_API_KEY.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('Network error. Please check your internet connection.');
    }
    
    process.exit(1);
  }
}

// CLI Interface
if (process.argv.length < 3) {
  console.log('Usage:');
  console.log('  node index.js "/youtube @channelname"  # Analyze single channel');
  console.log('  node index.js "/youtube"               # Batch process youtube-channels.md');
  process.exit(1);
}

const agent = new YouTubeAgent();
const command = process.argv.slice(2).join(' ');
agent.analyzeChannel(command);
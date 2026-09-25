/**
 * Generate captions and hashtags for social media sharing
 */

export interface ShareContent {
  caption: string;
  hashtags: string[];
}

/**
 * Generate share content for blog posts
 */
export function getBlogShareContent(
  title: string,
  category: string,
  excerpt?: string | null
): ShareContent {
  const categoryHashtags: Record<string, string[]> = {
    "music-business": ["MusicBusiness", "ProducerTips", "MakeMoneyWithMusic"],
    "industry-news": ["MusicIndustry", "MusicNews", "ArtistTips"],
    "ai-music": ["AIMusic", "MusicTech", "FutureSounds"],
  };

  const snippetText = excerpt ? ` - ${excerpt.slice(0, 60)}...` : "";
  
  return {
    caption: `📖 ${title}${snippetText}`,
    hashtags: [
      ...(categoryHashtags[category] || ["MusicProduction"]),
      "JokaBeatz",
      "MusicProduction",
    ],
  };
}

/**
 * Generate share content for products
 */
export function getProductShareContent(
  name: string,
  category: string,
  description?: string | null
): ShareContent {
  const categoryHashtags: Record<string, string[]> = {
    "Plugins": ["VSTPlugin", "ProducerPlugins"],
    "Beat Pack": ["BeatsForSale", "BeatPack"],
    "Beat Packs": ["BeatsForSale", "BeatPack"],
    "Drum Kit": ["DrumKit", "DrumSamples"],
    "Drum Kits": ["DrumKit", "DrumSamples"],
    "Sample Pack": ["SamplePack", "MusicSamples"],
    "Loop Pack": ["LoopPack", "MusicLoops"],
    "Preset Pack": ["Presets", "SynthPresets"],
    "Presets": ["Presets", "SynthPresets"],
    "Courses": ["MusicCourse", "LearnMusic"],
  };

  const descSnippet = description ? ` - ${description.slice(0, 50)}...` : " - perfect for your next hit!";

  return {
    caption: `🔥 Check out ${name}${descSnippet}`,
    hashtags: [
      ...(categoryHashtags[category] || ["MusicProduction"]),
      "JokaBeatz",
      "ProducerLife",
    ],
  };
}

/**
 * Generate share content for services
 */
export function getServiceShareContent(serviceName: string): ShareContent {
  const serviceHashtags: Record<string, string[]> = {
    "Mixing": ["MixingEngineer", "MixAndMaster"],
    "Mastering": ["MasteringEngineer", "AudioMastering"],
    "Custom Beats": ["CustomBeats", "BeatMaker"],
    "Consultation": ["MusicConsulting", "MusicCareer"],
  };

  return {
    caption: `🎵 Level up your music with professional ${serviceName.toLowerCase()}`,
    hashtags: [
      ...(serviceHashtags[serviceName] || ["MusicServices"]),
      "ProducerServices",
      "JokaBeatz",
      "MusicProduction",
    ],
  };
}

/**
 * Generate share content for static pages
 */
export function getPageShareContent(pageName: string): ShareContent {
  const pageContent: Record<string, ShareContent> = {
    "ai-mastering": {
      caption: "🎚️ Get radio-ready masters in minutes with AI-powered mastering!",
      hashtags: ["AIMastering", "AudioMastering", "MixAndMaster", "MusicProduction", "JokaBeatz"],
    },
    "free-beats": {
      caption: "🎹 Get 5 FREE professional beats delivered straight to your inbox!",
      hashtags: ["FreeBeats", "FreeBeatPack", "HipHopBeats", "TrapBeats", "JokaBeatz"],
    },
    "free-guide": {
      caption: "📚 Learn the insider secrets of music placements - FREE guide!",
      hashtags: ["MusicPlacements", "MusicBusiness", "IndependentArtist", "JokaBeatz"],
    },
    "shop": {
      caption: "🛒 Premium beats, drum kits & VST plugins for serious producers",
      hashtags: ["BeatsForSale", "ProducerPlugins", "MusicProduction", "JokaBeatz"],
    },
    "blog": {
      caption: "📝 Stay ahead with the latest music industry insights & producer tips",
      hashtags: ["MusicBlog", "ProducerTips", "MusicIndustry", "JokaBeatz"],
    },
    "music-videos": {
      caption: "🎬 Get stunning AI-powered music videos for your tracks!",
      hashtags: ["MusicVideo", "AIVideo", "MusicPromotion", "JokaBeatz"],
    },
    "services": {
      caption: "🎚️ Professional mixing, mastering & custom beats from Joka Beatz",
      hashtags: ["MusicServices", "MixingMastering", "MusicProduction", "JokaBeatz"],
    },
    "beats": {
      caption: "🎵 Browse & license professional beats - Hip Hop, Trap, R&B & more!",
      hashtags: ["BeatsForSale", "TypeBeats", "HipHopBeats", "TrapBeats", "JokaBeatz"],
    },
  };

  return pageContent[pageName] || {
    caption: "🎶 Check this out from Joka Beatz!",
    hashtags: ["JokaBeatz", "MusicProduction"],
  };
}

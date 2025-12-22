import React from "react";
import { Link, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Play, Loader2, TrendingUp, Award, Shield, Zap, Users, Lock, Star, Target, Cog, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoryCard from "../components/stories/StoryCard";
import SEO from "@/components/SEO";
import { generateSlug } from "@/lib/utils";

export default function StoryDetail() {
  const { slug } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');

  const { data: stories, isLoading, error } = useQuery({
    queryKey: ['stories'],
    queryFn: () => entities.Story.list(),
    initialData: [],
  });

  // Find story by slug or fallback to ID
  const story = React.useMemo(() => {
    if (slug) {
      // First try exact slug match
      const slugMatch = stories.find(s => generateSlug(s.company_name) === slug);
      if (slugMatch) return slugMatch;

      // Fallback: try case-insensitive company name match
      const nameMatch = stories.find(s =>
        s.company_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug.toLowerCase()
      );
      if (nameMatch) return nameMatch;
    }

    // Fallback to ID-based lookup for backwards compatibility
    if (storyId) {
      return stories.find(s => s.id === storyId);
    }

    return null;
  }, [stories, slug, storyId]);

  const powerIcons = {
    "Scale Economies": Zap,
    "Network Effects": Users,
    "Switching Costs": Lock,
    "Branding": Star,
    "Counter-Positioning": Target,
    "Cornered Resource": Shield,
    "Process Power": Cog
  };

  const getRatingColor = (rating) => {
    switch(rating) {
      case "Very High": return "text-green-400 bg-green-500/20 border-green-400/30";
      case "High": return "text-blue-400 bg-blue-500/20 border-blue-400/30";
      case "Medium": return "text-yellow-400 bg-yellow-500/20 border-yellow-400/30";
      case "Low": return "text-gray-400 bg-gray-500/20 border-gray-400/30";
      default: return "text-white/50 bg-white/5 border-white/10";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Story Not Found</h1>
          <p className="text-white/70 text-lg mb-8">
            The story you're looking for doesn't exist or has been removed.
          </p>
          <Link to={createPageUrl("Stories")}>
            <Button className="accent-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chicago Lore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const powerMetrics = [
    { name: "Scale Economies", value: story.scale_economies, icon: Zap },
    { name: "Network Effects", value: story.network_effects, icon: Users },
    { name: "Switching Costs", value: story.switching_costs, icon: Lock },
    { name: "Branding", value: story.branding, icon: Star },
    { name: "Counter-Positioning", value: story.counter_positioning, icon: Target },
    { name: "Cornered Resource", value: story.cornered_resource, icon: Shield },
    { name: "Process Power", value: story.process_power, icon: Cog }
  ].filter(metric => metric.value);

  return (
    <div className="min-h-screen py-20 px-6">
      {story && (
        <SEO 
          title={`${story.company_name} - ${story.founder_name} | Chicago Lore`}
          description={story.journey_summary?.substring(0, 160) + "..."}
          image={story.image_url}
          type="article"
        />
      )}
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("Stories")}>
          <Button className="glass-button mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chicago Lore
          </Button>
        </Link>

        {/* Header */}
        <div className="glass-card p-8 md:p-12 rounded-3xl border border-white/10 mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-white/10 text-white border-white/20">
              {story.category}
            </Badge>
            {story.founded && <Badge className="bg-white/10 text-white border-white/20">Founded {story.founded}</Badge>}
            {story.exit_status && <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">{story.exit_status}</Badge>}
            {story.exit_value && <Badge className="bg-green-500/20 text-green-300 border-green-400/30">{story.exit_value}</Badge>}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {story.company_name}
          </h1>
          <p className="text-2xl text-white/80 mb-6">{story.founder_name}</p>
          
          {story.website && (
            <a href={story.website} target="_blank" rel="noopener noreferrer" className="inline-block mb-4 mr-4">
              <Button className="glass-button">
                Visit Website
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          )}
          
          {story.read_time && (
            <div className="flex items-center gap-4 text-white/60">
              <Clock className="w-5 h-5" />
              <span>{story.read_time}</span>
            </div>
          )}
        </div>

        {/* Hero Card */}
        <div className="mb-8">
          <StoryCard story={story} size="large" />
        </div>

        {/* Journey Summary */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            The Journey
          </h2>
          <p className="text-xl text-white/80 leading-relaxed">{story.journey_summary}</p>
        </div>

        {/* Competitive Moats */}
        {(story.primary_power || story.secondary_power) && (
          <div className="glass-card p-8 rounded-3xl border border-white/10 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-400" />
              Competitive Moats
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {story.primary_power && (
                <div className="glass-card p-6 rounded-2xl border border-blue-400/30 bg-blue-500/10">
                  <p className="text-blue-400 text-sm font-semibold mb-2">PRIMARY MOAT</p>
                  <p className="text-2xl font-bold text-white">{story.primary_power}</p>
                </div>
              )}
              {story.secondary_power && (
                <div className="glass-card p-6 rounded-2xl border border-purple-400/30 bg-purple-500/10">
                  <p className="text-purple-400 text-sm font-semibold mb-2">SECONDARY MOAT</p>
                  <p className="text-2xl font-bold text-white">{story.secondary_power}</p>
                </div>
              )}
            </div>

            {/* Power Metrics Grid */}
            {powerMetrics.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {powerMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <div key={index} className={`p-4 rounded-xl border ${getRatingColor(metric.value)}`}>
                      <Icon className="w-6 h-6 mb-2" />
                      <p className="text-xs font-semibold mb-1">{metric.name}</p>
                      <p className="text-sm font-bold">{metric.value}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Power Analysis */}
        {story.power_analysis && (
          <div className="glass-card p-8 rounded-3xl border border-white/10 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6">Power Analysis</h2>
            <p className="text-white/70 leading-relaxed text-lg">{story.power_analysis}</p>
          </div>
        )}

        {/* Resources & Interviews */}
        {(story.podcast_links?.length > 0 || story.article_links?.length > 0 || story.resource_links?.length > 0) && (
          <div className="glass-card p-8 rounded-3xl border border-white/10 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-white" />
              Resources & Interviews
            </h2>

            {/* Podcasts */}
            {story.podcast_links?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">Podcasts</h3>
                <div className="space-y-3">
                  {story.podcast_links.map((podcast, index) => (
                    <a
                      key={index}
                      href={podcast.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white group-hover:text-blue-300 transition-colors">{podcast.title}</span>
                        <ExternalLink className="w-4 h-4 text-white/40 flex-shrink-0 group-hover:text-blue-300 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {story.article_links?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">Articles & Interviews</h3>
                <div className="space-y-3">
                  {story.article_links.map((article, index) => (
                    <a
                      key={index}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white group-hover:text-blue-300 transition-colors">{article.title}</span>
                        <ExternalLink className="w-4 h-4 text-white/40 flex-shrink-0 group-hover:text-blue-300 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Other Resources */}
            {story.resource_links?.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Additional Resources</h3>
                <div className="space-y-3">
                  {story.resource_links.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white group-hover:text-blue-300 transition-colors">{resource.title}</span>
                        <ExternalLink className="w-4 h-4 text-white/40 flex-shrink-0 group-hover:text-blue-300 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video (if available) */}
        {story.video_url && (
          <div className="glass-card p-6 rounded-3xl border border-white/10 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold text-white">Watch the Story</h3>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden">
              <iframe
                src={story.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Inspired by {story.founder_name}'s Journey?
          </h3>
          <p className="text-white/70 mb-6">
            Explore more founder stories and discover the resources that helped them succeed.
          </p>
          <Link to={createPageUrl("Stories")}>
            <Button className="accent-button">
              Read More Stories
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
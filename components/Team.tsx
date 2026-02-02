import React, { useEffect, useState } from "react";
import type {
  TeamMember,
  TeamSectionConfig,
} from "../src/types/database.types";
import { EditableText } from "../src/components/editor/EditableText";
import { EditableImage } from "../src/components/editor/EditableImage";
import { useEditor } from "../src/contexts/EditorContext";
import { useWebsite } from "../src/contexts/WebsiteContext";

// Default content
const DEFAULT_TEAM_CONFIG: TeamSectionConfig = {
  id: "team-config",
  website_id: "",
  heading: "Meet Our Team",
  subheading: "THE PEOPLE BEHIND THE MAGIC",
  layout: "grid",
  columns: 3,
  show_social_links: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "member-1",
    website_id: "",
    name: "John Doe",
    role: "Head Baker",
    bio: "Passionate about sourdough and artisanal breads.",
    image_url: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    social_links: {},
    display_order: 1,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "member-2",
    website_id: "",
    name: "Jane Smith",
    role: "Pastry Chef",
    bio: "Creating sweet masterpieces with love and precision.",
    image_url: "https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    social_links: {},
    display_order: 2,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "member-3",
    website_id: "",
    name: "Mike Jones",
    role: "Coffee Master",
    bio: "Expert barista bringing you the perfect brew.",
    image_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    social_links: {},
    display_order: 3,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const Team: React.FC = () => {
  const [config, setConfig] = useState<TeamSectionConfig | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading, contentVersion } = useWebsite();

  useEffect(() => {
    if (!websiteLoading) {
      setLoading(false);
      if (websiteData?.content?.team) {
        setConfig(websiteData.content.team.config || DEFAULT_TEAM_CONFIG);
        setMembers(websiteData.content.team.members || []);
      } else {
        setConfig(DEFAULT_TEAM_CONFIG);
        setMembers(DEFAULT_TEAM_MEMBERS);
      }
    }
  }, [websiteData?.content?.team, websiteLoading, contentVersion]);

  if (loading) {
    return (
      <section
        id="team"
        className="py-24 bg-bakery-light relative overflow-hidden flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-bakery-text/80">Loading...</p>
        </div>
      </section>
    );
  }

  if (!config || members.length === 0) return null;

  return (
    <section id="team" className="py-24 bg-bakery-cream relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          {config.subheading &&
            (isEditing ? (
              <EditableText
                value={config.subheading}
                onSave={async (newValue) => {
                  const updatedConfig = { ...config, subheading: newValue };
                  await saveField("team", "config", updatedConfig);
                  setConfig(updatedConfig);
                }}
                tag="span"
                className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block mb-2"
              />
            ) : (
              <span className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block mb-2">
                {config.subheading}
              </span>
            ))}
          {isEditing ? (
            <EditableText
              value={config.heading}
              onSave={async (newValue) => {
                const updatedConfig = { ...config, heading: newValue };
                await saveField("team", "config", updatedConfig);
                setConfig(updatedConfig);
              }}
              tag="h2"
              className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark"
            />
          ) : (
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark">
              {config.heading}
            </h2>
          )}
          <div className="w-24 h-1 bg-bakery-sand mx-auto rounded-full mt-6" />
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-${config.columns || 3} gap-10`}
        >
          {members.map((member) => (
            <div key={member.id} className="group relative">
              {/* Image Card */}
              <div className="relative overflow-hidden rounded-2xl aspect-[3/4] shadow-lg mb-6">
                <EditableImage
                  src={
                    member.image_url ||
                    "https://i.pravatar.cc/500?img=" + member.id
                  }
                  alt={member.name}
                  onSave={async (newUrl) => {
                    const updatedMembers = members.map((m) =>
                      m.id === member.id ? { ...m, image_url: newUrl } : m,
                    );
                    await saveField("team", "members", updatedMembers);
                    setMembers(updatedMembers);
                  }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {member.bio && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-bakery-dark/80 via-transparent to-transparent ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-300 flex flex-col justify-end p-6`}
                  >
                    {isEditing ? (
                      <EditableText
                        value={member.bio}
                        onSave={async (newValue) => {
                          const updatedMembers = members.map((m) =>
                            m.id === member.id ? { ...m, bio: newValue } : m,
                          );
                          await saveField("team", "members", updatedMembers);
                          setMembers(updatedMembers);
                        }}
                        tag="p"
                        multiline
                        className="text-bakery-sand font-sans text-sm"
                      />
                    ) : (
                      <p className="text-bakery-sand font-sans text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        "{member.bio}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-center">
                {isEditing ? (
                  <EditableText
                    value={member.name}
                    onSave={async (newValue) => {
                      const updatedMembers = members.map((m) =>
                        m.id === member.id ? { ...m, name: newValue } : m,
                      );
                      await saveField("team", "members", updatedMembers);
                      setMembers(updatedMembers);
                    }}
                    tag="h3"
                    className="font-serif text-2xl font-bold text-bakery-dark mb-1"
                  />
                ) : (
                  <h3 className="font-serif text-2xl font-bold text-bakery-dark mb-1">
                    {member.name}
                  </h3>
                )}
                {isEditing ? (
                  <EditableText
                    value={member.role}
                    onSave={async (newValue) => {
                      const updatedMembers = members.map((m) =>
                        m.id === member.id ? { ...m, role: newValue } : m,
                      );
                      await saveField("team", "members", updatedMembers);
                      setMembers(updatedMembers);
                    }}
                    tag="p"
                    className="font-sans text-bakery-primary font-bold text-sm tracking-wide uppercase mb-3"
                  />
                ) : (
                  <p className="font-sans text-bakery-primary font-bold text-sm tracking-wide uppercase mb-3">
                    {member.role}
                  </p>
                )}
                {member.bio && isEditing && (
                  <EditableText
                    value={member.bio}
                    onSave={async (newValue) => {
                      const updatedMembers = members.map((m) =>
                        m.id === member.id ? { ...m, bio: newValue } : m,
                      );
                      await saveField("team", "members", updatedMembers);
                      setMembers(updatedMembers);
                    }}
                    tag="p"
                    multiline
                    className="text-sm text-gray-600 mt-2"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/ui/navbar";
import { createClient } from "@/lib/supabase/client";
import { Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  elo_rating: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_drawn: number;
}

export default function PlayersPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  // Mock data - in real app this would come from API
  const friends = [
    {
      username: "joebeez",
      handle: "@joebeez",
      elo: 1215,
      record: "2W - 1L - 0D",
      winRate: "67%",
      lastActive: "2h ago",
    },
  ];

  const winRate = profile?.games_played
    ? Math.round(((profile.games_won || 0) / profile.games_played) * 100)
    : 0;

  const record = `${profile?.games_won || 0}W - ${profile?.games_lost || 0}L - ${profile?.games_drawn || 0}D`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar username={profile?.username} elo={profile?.elo_rating} />

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Players</h1>
          <p className="text-sm text-muted-foreground">
            Your profile and friends
          </p>
        </div>

        {/* Current User Profile */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading...
              </div>
            ) : profile ? (
              <>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
                      {profile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {profile.display_name || profile.username}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20">
                        Online
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{profile.username}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-2xl font-bold">{profile.elo_rating}</div>
                    <div className="text-xs text-muted-foreground">ELO Rating</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Record</div>
                    <div className="font-semibold">{record}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                    <div className="font-semibold">{winRate}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Games Played</div>
                    <div className="font-semibold">{profile.games_played}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Please log in to view your profile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friends Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Friends</CardTitle>
                <CardDescription className="mt-1">
                  {friends.length} {friends.length === 1 ? "friend" : "friends"}
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <UserPlus className="h-4 w-4" />
                Add Friend
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search friends..." className="pl-9" />
            </div>

            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.username}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="font-semibold">
                      {friend.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">
                        {friend.username}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {friend.lastActive}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {friend.handle}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-lg font-bold">{friend.elo}</div>
                    <div className="text-xs text-muted-foreground">
                      {friend.winRate}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Challenge
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

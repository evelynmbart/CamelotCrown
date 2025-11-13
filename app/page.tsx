import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ChevronDown } from "lucide-react";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect("/lobby");
  }

  // Get stats from database
  const { count: gamesCount } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true });

  const { count: playersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return (
    <>
      <main className="bg-background h-screen flex items-center justify-space-between flex-col">
        <div className="flex items-center justify-end w-full h-12 p-2 ">
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-center gap-6 text-lg">
          <span>
            <span className="font-bold text-primary text-2xl">
              {gamesCount ?? 0}
            </span>{" "}
            <span>games</span>
          </span>
          <span>
            <span className="font-bold text-primary text-2xl">
              {playersCount ?? 0}
            </span>{" "}
            <span>players</span>
          </span>
        </div>
        <section className=" flex items-center justify-center gap-20 h-full w-ful">
          <div className="flex items-center justify-center">
            <img
              src="/camelotcrown.png"
              alt="Crowned knight piece surrounded by two pawn pieces"
              className="w-[350px] h-[350px] object-cover"
            />
          </div>
          <div className="">
            <h1 className="text-center p-4 text-4xl font-bold text-primary">
              Learn Camelot <br /> Earn your Crown <br /> Have fun!
            </h1>
            <Button className="w-full text-lg font-bold py-6" variant="default">
              Get Started
            </Button>
          </div>
        </section>
        <div className="flex items-center justify-center flex-col font-bold mb-4 text-primary">
          <button>Learn more</button>
          <ChevronDown />
        </div>
      </main>
    </>
  );
}

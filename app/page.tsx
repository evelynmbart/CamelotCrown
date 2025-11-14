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
        <div className="fixed top-0 right-0 flex items-center h-12 pr-3">
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-center gap-6 pt-4 text-lg">
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
        <section className="flex flex-col items-center justify-center gap-8 h-full w-full lg:flex-row lg:gap-20">
          <div className="flex items-center justify-center">
            <img
              src="/camelotcrown.png"
              alt="Crowned knight piece surrounded by two pawn pieces"
              className="w-[250px] h-[250px] object-cover lg:w-[450px] lg:h-[450px]"
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

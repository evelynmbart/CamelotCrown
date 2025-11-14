import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  ChevronDown,
  Facebook,
  Instagram,
  Twitch,
  Twitter,
  Youtube,
} from "lucide-react";
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
      <header className="bg-background h-screen flex items-center justify-space-between flex-col">
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
              {/*THIS DOESN'T WORK YET */}
              Get Started
            </Button>
          </div>
        </section>
        <div className="flex items-center justify-center flex-col font-bold mb-4 text-primary">
          <button>Learn more</button>
          <ChevronDown />
        </div>
      </header>
      <main className="flex flex-col items-center justify-center gap-10">
        <Card className="w-3/4 md:w-1/2">
          <CardHeader>
            <CardTitle>
              <img
                src="/camelotcrown.png"
                alt="Crowned knight piece surrounded by two pawn pieces"
                className="w-[250px] h-[250px] object-cover lg:w-[350px] lg:h-[350px] mx-auto"
              />
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Learn Camelot
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="w-3/4 md:w-1/2">
          <CardHeader>
            <CardTitle>
              <img
                src="/camelotcrown.png"
                alt="Crowned knight piece surrounded by two pawn pieces"
                className="w-[250px] h-[250px] object-cover lg:w-[350px] lg:h-[350px] mx-auto"
              />
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Learn Camelot
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="w-3/4 md:w-1/2">
          <CardHeader>
            <CardTitle>
              <img
                src="/camelotcrown.png"
                alt="Crowned knight piece surrounded by two pawn pieces"
                className="w-[250px] h-[250px] object-cover lg:w-[350px] lg:h-[350px] mx-auto"
              />
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Learn Camelot
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="w-3/4 md:w-1/2">
          <CardHeader>
            <CardTitle>
              <img
                src="/camelotcrown.png"
                alt="Crowned knight piece surrounded by two pawn pieces"
                className="w-[250px] h-[250px] object-cover lg:w-[350px] lg:h-[350px] mx-auto"
              />
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Learn Camelot
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
      <footer className="flex flex-col items-center justify-center gap-10 w-full mt-15">
        {/*NOTHING IN FOOTER IS LINKED YET*/}
        <section className="mb-6">
          <h4 className="text-center text-lg">
            Take your games and training wherever you go with our{" "}
            <b>mobile apps</b>
            <div className="flex items-center justify-center gap-8 mt-4">
              {/* remove these or actually add links to them in the future */}
              <img
                className="w-1/2 max-w-[200px] object-cover"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/2560px-Download_on_the_App_Store_Badge.svg.png"
              />
              <img
                className="w-1/2 max-w-[200px] object-cover"
                src="https://getsby.com/wp-content/uploads/2025/03/google-play-store-badge.png"
              />
            </div>
          </h4>
        </section>
        <section className="flex flex-col items-center justify-center gap-6 w-full max-w-[500px] mb-6">
          <h1 className="text-4xl font-bold text-primary">
            Learn, Play, and Have fun!
          </h1>
          <Button className="text-lg font-bold py-6 w-3/4" variant="default">
            {/*THIS DOESN'T WORK YET */}
            Get Started
          </Button>
        </section>
        <section className="text-muted-foreground flex flex-col gap-2">
          <div>
            <ul className="flex flex-wrap items-center justify-center gap-2 text-sm cursor-pointer">
              <li className="hover:text-yellow-500">Support •</li>
              <li className="hover:text-yellow-500">CamelotCrown Terms •</li>
              <li className="hover:text-yellow-500">About •</li>
              <li className="hover:text-yellow-500">Students •</li>
              <li className="hover:text-yellow-500">Careers •</li>
              <li className="hover:text-yellow-500">Developers •</li>
              <li className="hover:text-yellow-500">User Agreement •</li>
              <li className="hover:text-yellow-500">Privacy Policy •</li>
              <li className="hover:text-yellow-500">Privacy Settings •</li>
              <li className="hover:text-yellow-500">Cheating & Fair Play •</li>
              <li className="hover:text-yellow-500">Partners •</li>
              <li className="hover:text-yellow-500">Compliance •</li>
              <li className="hover:text-yellow-500">CamelotCrown.com © 2025</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Instagram className="hover:text-pink-500 cursor-pointer" />
            <Facebook className="hover:text-blue-600 cursor-pointer" />
            <Youtube className="hover:text-red-600 cursor-pointer" />
            <Twitch className="hover:text-purple-600 cursor-pointer" />
            <Twitter className="hover:text-blue-400 cursor-pointer" />
          </div>
        </section>
      </footer>
    </>
  );
}

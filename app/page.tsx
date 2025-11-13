import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect("/lobby");
  }

  return (
    <>
      <main>
        <div>
          <span>[num of active users] playing now</span>
          <span>[num of active games] games today</span>
        </div>
        <section>
          <div>[this is an image]</div>
          <div>
            <h2>
              Learn and play Camelot, the super old strategy game no two players
              play the same
            </h2>
            <button>Get Started</button>
          </div>
        </section>
        <button>Learn more</button>
      </main>
    </>
  );
}

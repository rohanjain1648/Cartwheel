import { JoinForm } from "@/components/JoinForm";

export default function HomePage() {
  return (
    <main className="p-8 flex flex-col gap-6 items-start">
      <div>
        <h1 className="text-3xl font-semibold">Cartwheel</h1>
        <p className="text-slate-600 mt-1">
          One shared cart. Every action is a tool your agent can call.
        </p>
      </div>
      <JoinForm />
    </main>
  );
}

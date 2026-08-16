import SearchForm from "@/app/components/SearchForm";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Fairway</h1>
          <p className="max-w-md text-zinc-500">
            Find golf courses near you and book straight through the course&apos;s own site.
          </p>
        </div>
        <SearchForm />
      </div>
    </div>
  );
}

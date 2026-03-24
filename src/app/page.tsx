import type { Metadata } from "next";
import BabyPool from "@/components/BabyPool";

export const metadata: Metadata = {
  title: "Baby Guessing Pool",
  description: "Submit your guess for the baby's weight, length, and birth date!",
};

export default function Home() {
  return <BabyPool />;
}

"use client";
import { useEffect, useState } from "react";
import { AUDIENCES, audienceKey } from "./lib/site";

// Eyebrow + subhead swap on ?aud=hiring / ?aud=clients (ad message match). The H1 stays constant.
export function HeroEyebrow() {
  const [k, setK] = useState("general");
  useEffect(() => setK(audienceKey()), []);
  return <div data-reveal="0" className="hero-kicker">{AUDIENCES[k].eyebrow}</div>;
}

export function HeroSub() {
  const [k, setK] = useState("general");
  useEffect(() => setK(audienceKey()), []);
  return <p data-reveal="420" className="sub">{AUDIENCES[k].sub}</p>;
}

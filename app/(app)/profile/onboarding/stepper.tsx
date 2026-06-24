"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AppLink } from "@/components/nav/app-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import {
  GENDER_CHOICES,
  FAMILIAL_STATUS,
  DIVORCE_CERTIFICATION,
  CHILDREN_CUSTODY,
  EDUCATION_LEVELS,
  PRIMARY_INDUSTRIES,
  PERSONA_CATEGORIES,
  RELATIONSHIP_INTENT_WARNING,
  ALTAR_TIMELINE,
  COVENANT_FOUNDATIONS_SAFEGUARD,
  RELOCATION_OPENNESS,
  SPIRITUAL_RHYTHMS_HOME_PROMPT,
  SPIRITUAL_RHYTHMS_HOME,
  DOCTRINAL_ALIGNMENT,
  HOUSEHOLD_LEADERSHIP,
  PROFESSIONAL_RHYTHMS,
  FINANCIAL_STEWARDSHIP,
  ENVIRONMENT_PREFERENCE,
  INTEREST_PILLARS,
  CHRISTIAN_RHYTHMS,
  CORE_FAITH_IDENTITY,
  JOURNEY_INTRO,
  AMARI_PATH,
  ZAHARI_PATH,
  type Option,
} from "@/lib/profile/create-profile";
import {
  formatPersonaAliasDisplay,
  parsePersonaAliasBase,
} from "@/lib/profile/persona-alias";
import { saveStep } from "./actions";

type Profile = {
  firstName: string;
  lastName: string;
  gender: "man" | "woman" | "";
  birthYear: string;
  country: string;
  city: string;
  countryOfHeritage: string;
  familialStatus: string;
  divorceCertified: boolean;
  childrenCount: string;
  childrenCustody: string;
  educationLevel: string;
  profession: string;
  primaryIndustry: string;
  personaCategory: string;
  personaAlias: string;
  personaAliasCode: string;
  phone: string;
  altarTimeline: string;
  covenantFoundationsSafeguard: boolean;
  relocationOpenness: string;
  spiritualRhythmHome: string;
  doctrinalAlignment: string;
  householdLeadership: string;
  professionalRhythm: string;
  financialStewardship: string[];
  environmentPreference: string;
  interests: string[];
  coreFaithIdentity: string;
};

const SECTIONS = ["identity", "intent", "interests", "journey"] as const;
const CHILDREN_PRESETS = ["0", "1", "2", "3"];

function ChoiceList({
  options,
  value,
  onSelect,
}: {
  options: Option[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onSelect(o.value)}
          className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
            value === o.value
              ? "border-plum-900 bg-plum-900 text-plum-100"
              : "border-plum-900/15 bg-white text-plum-900 hover:border-plum-900/40"
          }`}
        >
          <div className="font-medium">{o.label}</div>
          {o.description && (
            <div className="text-xs opacity-70 mt-1">{o.description}</div>
          )}
        </button>
      ))}
    </div>
  );
}

function MultiChoiceList({
  options,
  values,
  onToggle,
}: {
  options: Option[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
              on
                ? "border-plum-900 bg-plum-900 text-plum-100"
                : "border-plum-900/15 bg-white text-plum-900 hover:border-plum-900/40"
            }`}
          >
            <div className="font-medium">{o.label}</div>
            {o.description && (
              <div className="text-xs opacity-70 mt-1">{o.description}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-medium text-plum-900 mb-2 mt-2">{children}</div>
  );
}

export function CreateProfileStepper({
  startAtStep,
  email,
  profile,
}: {
  startAtStep: number;
  email: string;
  profile: Profile;
}) {
  const totalSteps = SECTIONS.length;
  const [step, setStep] = useState(Math.min(startAtStep, totalSteps - 1));
  const [data, setData] = useState<Profile>(profile);
  const allPresetPersonas = PERSONA_CATEGORIES.flatMap((c) => c.personas);
  const [otherChildren, setOtherChildren] = useState(
    profile.childrenCount !== "" &&
      !CHILDREN_PRESETS.includes(profile.childrenCount),
  );
  const [customAliasMode, setCustomAliasMode] = useState(() => {
    const base = parsePersonaAliasBase(profile.personaAlias);
    return !!base && !allPresetPersonas.includes(base);
  });
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const section = SECTIONS[step];
  const hasChildren = data.childrenCount !== "" && data.childrenCount !== "0";

  function setChildrenCount(count: string, opts?: { other?: boolean }) {
    if (opts?.other !== undefined) setOtherChildren(opts.other);
    setData((d) => ({
      ...d,
      childrenCount: count,
      ...(count === "0" ? { childrenCustody: "" } : {}),
    }));
  }

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function toggle(arr: string[], v: string) {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  function persist(
    opts: {
      finalize?: boolean;
      toStep?: number;
      onSuccess?: () => void;
    } = {},
  ) {
    setErr(null);
    const fd = new FormData();
    fd.set("step", String(opts.toStep ?? step));
    fd.set("totalSteps", String(totalSteps));
    if (opts.finalize) fd.set("finalize", "1");
    const textKeys: Array<keyof Profile> = [
      "firstName",
      "lastName",
      "gender",
      "birthYear",
      "country",
      "city",
      "countryOfHeritage",
      "familialStatus",
      "childrenCount",
      "childrenCustody",
      "educationLevel",
      "profession",
      "primaryIndustry",
      "personaCategory",
      "personaAlias",
      "phone",
      "altarTimeline",
      "relocationOpenness",
      "spiritualRhythmHome",
      "doctrinalAlignment",
      "householdLeadership",
      "professionalRhythm",
      "environmentPreference",
      "coreFaithIdentity",
    ];
    for (const k of textKeys) fd.set(k, String(data[k] ?? ""));
    fd.set("divorceCertified", data.divorceCertified ? "1" : "0");
    fd.set(
      "covenantFoundationsSafeguard",
      data.covenantFoundationsSafeguard ? "1" : "0",
    );
    fd.set("interests", JSON.stringify(data.interests));
    fd.set("financialStewardship", JSON.stringify(data.financialStewardship));
    start(async () => {
      try {
        const result = await saveStep(fd);
        if (result.personaAliasCode != null) {
          set("personaAliasCode", String(result.personaAliasCode));
        }
        opts.onSuccess?.();
      } catch (e: unknown) {
        if (isRedirectError(e)) return;
        setErr((e as Error).message ?? "Could not save.");
      }
    });
  }

  function validate(): string | null {
    if (section === "identity") {
      if (!data.firstName.trim()) return "First name is required.";
      if (!data.lastName.trim()) return "Last name is required.";
      if (!data.gender) return "Gender is required.";
      if (!data.birthYear) return "Year of birth is required.";
      if (!data.country.trim()) return "Current location is required.";
      if (!data.city.trim()) return "Current city is required.";
      if (!data.countryOfHeritage.trim()) return "Country of heritage is required.";
      if (!data.familialStatus) return "Familial status is required.";
      if (data.familialStatus === "divorced" && !data.divorceCertified)
        return "Please confirm the divorce certification to proceed.";
      if (data.childrenCount === "") return "Please indicate whether you have children.";
      if (hasChildren && !data.childrenCustody)
        return "Please select your custody arrangement.";
      if (!data.educationLevel) return "Highest education level is required.";
      if (!data.profession.trim()) return "Profession / core expertise is required.";
      if (!data.primaryIndustry) return "Primary industry is required.";
      if (!data.personaCategory) return "Please select a Community Alias category.";
      if (!data.personaAlias.trim())
        return "Please choose or create a Community Alias.";
      if (data.personaAlias.trim().length < 2)
        return "Community Alias must be at least 2 characters.";
      if (/#\d+$/.test(data.personaAlias.trim()))
        return "Enter only your alias name — a unique number is added automatically.";
      if (!data.phone.trim()) return "Phone number is required.";
      return null;
    }
    if (section === "intent") {
      if (!data.altarTimeline) return "Please select your timeline to the altar.";
      if (
        data.altarTimeline === "covenant_foundations" &&
        !data.covenantFoundationsSafeguard
      )
        return "Please confirm the Time-Wasting Safeguard to proceed.";
      if (!data.relocationOpenness) return "Please answer the relocation question.";
      if (!data.spiritualRhythmHome)
        return "Please select your spiritual rhythms in the home.";
      if (!data.doctrinalAlignment) return "Please select your doctrinal alignment.";
      if (!data.householdLeadership)
        return "Please select your conviction on household leadership & authority.";
      if (!data.professionalRhythm) return "Please select your professional rhythm.";
      if (data.financialStewardship.length === 0)
        return "Please select your financial legacy & stewardship.";
      if (!data.environmentPreference)
        return "Please select your lifestyle & living preference.";
      return null;
    }
    if (section === "interests") {
      if (data.interests.length === 0)
        return "Please select at least one interest or spiritual rhythm.";
      if (!data.coreFaithIdentity) return "Please select your core faith identity.";
      return null;
    }
    return null;
  }

  function next() {
    const problem = validate();
    if (problem) {
      setErr(problem);
      return;
    }
    const finalize = section === "interests";
    const nextStep = Math.min(step + 1, totalSteps - 1);
    persist({
      toStep: nextStep,
      finalize,
      onSuccess: () => setStep(nextStep),
    });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const personasForCategory =
    PERSONA_CATEGORIES.find((c) => c.category === data.personaCategory)?.personas ??
    [];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="text-xs text-plum-900/50 uppercase tracking-widest mb-1">
          Create Profile · {step + 1} of {totalSteps}
        </div>
        <div className="h-1.5 bg-plum-900/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-plum-900 transition-all"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {err && (
        <Alert tone="danger" className="mb-4">
          {err}
        </Alert>
      )}

      {section === "identity" && (
        <div className="space-y-4">
          <h2 className="text-display text-2xl text-plum-900">Identity</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={data.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={data.lastName}
                onChange={(e) => set("lastName", e.target.value)}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Gender</FieldLabel>
            <div className="flex gap-2">
              {GENDER_CHOICES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => set("gender", g.value)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    data.gender === g.value
                      ? "bg-plum-900 text-plum-100"
                      : "bg-plum-900/5 text-plum-900"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="birthYear">Date of Birth (year)</Label>
            <Input
              id="birthYear"
              type="number"
              value={data.birthYear}
              onChange={(e) => set("birthYear", e.target.value)}
              placeholder="e.g. 1990"
            />
          </div>

          <div>
            <FieldLabel>Nationality &amp; Cultural Heritage</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="country">Current Location</Label>
                <Input
                  id="country"
                  value={data.country}
                  onChange={(e) => set("country", e.target.value)}
                  placeholder="e.g. Kenya"
                />
              </div>
              <div>
                <Label htmlFor="city">Current City</Label>
                <Input
                  id="city"
                  value={data.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="countryOfHeritage">Country of Heritage</Label>
              <Input
                id="countryOfHeritage"
                value={data.countryOfHeritage}
                onChange={(e) => set("countryOfHeritage", e.target.value)}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Familial Status</FieldLabel>
            <ChoiceList
              options={FAMILIAL_STATUS}
              value={data.familialStatus}
              onSelect={(v) => set("familialStatus", v)}
            />
            {data.familialStatus === "divorced" && (
              <label className="mt-3 flex items-start gap-2 text-sm text-plum-900/80">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={data.divorceCertified}
                  onChange={(e) => set("divorceCertified", e.target.checked)}
                />
                <span>{DIVORCE_CERTIFICATION}</span>
              </label>
            )}
          </div>

          <div>
            <FieldLabel>Do you have children?</FieldLabel>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setChildrenCount("0", { other: false })}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  data.childrenCount === "0" && !otherChildren
                    ? "bg-plum-900 text-plum-100"
                    : "bg-plum-900/5 text-plum-900"
                }`}
              >
                None
              </button>
              {["1", "2", "3"].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setChildrenCount(n, { other: false })}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    data.childrenCount === n && !otherChildren
                      ? "bg-plum-900 text-plum-100"
                      : "bg-plum-900/5 text-plum-900"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOtherChildren(true);
                  setChildrenCount("");
                }}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  otherChildren
                    ? "bg-plum-900 text-plum-100"
                    : "bg-plum-900/5 text-plum-900"
                }`}
              >
                Other
              </button>
            </div>
            {otherChildren && (
              <Input
                type="number"
                className="mt-2 max-w-[8rem]"
                value={data.childrenCount}
                onChange={(e) => setChildrenCount(e.target.value)}
                placeholder="Number"
                min={1}
              />
            )}
            {hasChildren && (
              <div className="mt-3">
                <FieldLabel>Custody arrangement</FieldLabel>
                <ChoiceList
                  options={CHILDREN_CUSTODY}
                  value={data.childrenCustody}
                  onSelect={(v) => set("childrenCustody", v)}
                />
              </div>
            )}
          </div>

          <div>
            <FieldLabel>Education &amp; Profession</FieldLabel>
            <Label htmlFor="educationLevel">Highest Level</Label>
            <select
              id="educationLevel"
              value={data.educationLevel}
              onChange={(e) => set("educationLevel", e.target.value)}
              className="mt-1 w-full rounded-xl border border-plum-900/15 bg-white px-3 py-2 text-sm text-plum-900"
            >
              <option value="">Select…</option>
              {EDUCATION_LEVELS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="mt-3">
              <Label htmlFor="profession">Profession / Core Expertise</Label>
              <Input
                id="profession"
                value={data.profession}
                onChange={(e) => set("profession", e.target.value)}
              />
            </div>
            <div className="mt-3">
              <FieldLabel>Primary Industry</FieldLabel>
              <ChoiceList
                options={PRIMARY_INDUSTRIES}
                value={data.primaryIndustry}
                onSelect={(v) => set("primaryIndustry", v)}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Community Alias</FieldLabel>
            <p className="text-xs text-plum-900/50 mb-2">
              This private name is what you will use to interact with people and
              is not visible to others in the ecosystem until mutual alignment is
              confirmed.
            </p>
            <select
              value={data.personaCategory}
              onChange={(e) => {
                set("personaCategory", e.target.value);
                set("personaAlias", "");
                setCustomAliasMode(false);
              }}
              className="w-full rounded-xl border border-plum-900/15 bg-white px-3 py-2 text-sm text-plum-900"
            >
              <option value="">Select a category…</option>
              {PERSONA_CATEGORIES.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
            {personasForCategory.length > 0 && (
              <div className="mt-2 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {personasForCategory.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setCustomAliasMode(false);
                        set("personaAlias", p);
                      }}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        !customAliasMode &&
                        parsePersonaAliasBase(data.personaAlias) === p
                          ? "bg-plum-900 text-plum-100"
                          : "bg-plum-900/5 text-plum-900"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAliasMode(true);
                      set("personaAlias", "");
                    }}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      customAliasMode
                        ? "bg-plum-900 text-plum-100"
                        : "bg-plum-900/5 text-plum-900"
                    }`}
                  >
                    Create your own
                  </button>
                </div>
                {customAliasMode && (
                  <div>
                    <Label htmlFor="customPersonaAlias">Your unique alias</Label>
                    <Input
                      id="customPersonaAlias"
                      value={data.personaAlias}
                      onChange={(e) => set("personaAlias", e.target.value)}
                      placeholder="e.g. The Navigator"
                      maxLength={64}
                      className="mt-1"
                    />
                    <p className="text-xs text-plum-900/50 mt-1">
                      A unique number is added automatically so members can share
                      the same alias name (e.g. The Steward#514).
                    </p>
                  </div>
                )}
                {data.personaAlias.trim() && (
                  <p className="text-sm text-plum-900">
                    <span className="font-medium">Your Public Display Identity: </span>
                    {formatPersonaAliasDisplay(
                      data.personaAlias,
                      data.personaAliasCode
                        ? Number(data.personaAliasCode)
                        : null,
                    )}
                    {!data.personaAliasCode && (
                      <span className="text-plum-900/50 text-xs block mt-1">
                        Your unique number is assigned when you continue.
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="email">Primary Email</Label>
            <Input id="email" value={email} readOnly className="opacity-70" />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+254…"
            />
          </div>
        </div>
      )}

      {section === "intent" && (
        <div className="space-y-5">
          <h2 className="text-display text-2xl text-plum-900">
            Relationship and Intent
          </h2>
          <Alert tone="warning">PS: {RELATIONSHIP_INTENT_WARNING}</Alert>

          <div>
            <FieldLabel>A. Your Timeline to the Altar</FieldLabel>
            <p className="text-xs text-plum-900/50 mb-2">
              Be completely honest about your current season. This forces absolute
              transparency so nobody&apos;s time is wasted.
            </p>
            <ChoiceList
              options={ALTAR_TIMELINE}
              value={data.altarTimeline}
              onSelect={(v) => {
                set("altarTimeline", v);
                if (v !== "covenant_foundations") {
                  set("covenantFoundationsSafeguard", false);
                }
              }}
            />
            {data.altarTimeline === "covenant_foundations" && (
              <Alert tone="warning" className="mt-3">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={data.covenantFoundationsSafeguard}
                    onChange={(e) =>
                      set("covenantFoundationsSafeguard", e.target.checked)
                    }
                  />
                  <span>{COVENANT_FOUNDATIONS_SAFEGUARD}</span>
                </label>
              </Alert>
            )}
          </div>

          <div className="border-t border-plum-900/10 pt-4">
            <h3 className="font-medium text-plum-900">B. Relational Non-Negotiables</h3>
            <p className="text-xs text-plum-900/50 mb-3">
              Briefly anchor your expectations so our curators can protect your
              boundaries.
            </p>

            <FieldLabel>Are you open to relocating for marriage?</FieldLabel>
            <ChoiceList
              options={RELOCATION_OPENNESS}
              value={data.relocationOpenness}
              onSelect={(v) => set("relocationOpenness", v)}
            />

            <p className="text-sm text-plum-900/80 mb-3">
              {SPIRITUAL_RHYTHMS_HOME_PROMPT}
            </p>
            <ChoiceList
              options={SPIRITUAL_RHYTHMS_HOME}
              value={data.spiritualRhythmHome}
              onSelect={(v) => set("spiritualRhythmHome", v)}
            />

            <FieldLabel>Doctrinal Alignment</FieldLabel>
            <ChoiceList
              options={DOCTRINAL_ALIGNMENT}
              value={data.doctrinalAlignment}
              onSelect={(v) => set("doctrinalAlignment", v)}
            />

            <FieldLabel>Convictions on Household Leadership &amp; Authority</FieldLabel>
            <p className="text-xs text-plum-900/50 mb-2">
              How do you believe a Christian household should be structurally and
              spiritually led? Select the blueprint that you would like to abide by.
            </p>
            <ChoiceList
              options={HOUSEHOLD_LEADERSHIP}
              value={data.householdLeadership}
              onSelect={(v) => set("householdLeadership", v)}
            />
          </div>

          <div className="border-t border-plum-900/10 pt-4">
            <h3 className="font-medium text-plum-900">
              II. Career, Wealth &amp; Lifestyle Dynamics
            </h3>
            <p className="text-xs text-plum-900/50 mb-3">
              Aligning how you manage time, resources, and ambition together.
            </p>

            <FieldLabel>Professional Rhythms</FieldLabel>
            <ChoiceList
              options={PROFESSIONAL_RHYTHMS}
              value={data.professionalRhythm}
              onSelect={(v) => set("professionalRhythm", v)}
            />

            <FieldLabel>Financial Legacy &amp; Stewardship</FieldLabel>
            <MultiChoiceList
              options={FINANCIAL_STEWARDSHIP}
              values={data.financialStewardship}
              onToggle={(v) =>
                set("financialStewardship", toggle(data.financialStewardship, v))
              }
            />

            <FieldLabel>Lifestyle &amp; Living Preferences</FieldLabel>
            <p className="text-xs text-plum-900/50 mb-2">
              Setting expectations for where and how the physical household
              operates.
            </p>
            <ChoiceList
              options={ENVIRONMENT_PREFERENCE}
              value={data.environmentPreference}
              onSelect={(v) => set("environmentPreference", v)}
            />
          </div>
        </div>
      )}

      {section === "interests" && (
        <div className="space-y-5">
          <h2 className="text-display text-2xl text-plum-900">
            Interests &amp; Lifestyle Alignment
          </h2>
          <p className="text-sm text-plum-900/60">
            Select the lifestyle areas, interests, and spiritual habits that
            describe how you spend your time and build your life. This helps us
            find real alignment in how you live day-to-day.
          </p>
          {INTEREST_PILLARS.map((pillar) => (
            <div key={pillar.pillar} className="border-t border-plum-900/10 pt-4">
              <h3 className="font-medium text-plum-900 mb-2">{pillar.pillar}</h3>
              {pillar.pillar === "I. Lifestyle & Culture" && (
                <p className="text-xs text-plum-900/50 mb-2">
                  Select your favourite ways to unwind and explore.
                </p>
              )}
              {pillar.pillar === "II. Health & Wellness" && (
                <p className="text-xs text-plum-900/50 mb-2">
                  Select how you take care of your body and mind.
                </p>
              )}
              {pillar.pillar === "III. Impact" && (
                <p className="text-xs text-plum-900/50 mb-2">
                  Select the areas that drive your life.
                </p>
              )}
              {pillar.groups.map((group) => (
                <div key={group.heading} className="mb-3">
                  <div className="text-xs uppercase tracking-widest text-plum-900/50 mb-2">
                    {group.heading}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => set("interests", toggle(data.interests, item))}
                        className={`rounded-full px-3 py-1.5 text-sm transition ${
                          data.interests.includes(item)
                            ? "bg-plum-900 text-plum-100"
                            : "bg-plum-900/5 text-plum-900 hover:bg-plum-900/10"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="border-t border-plum-900/10 pt-4">
            <h3 className="font-medium text-plum-900 mb-2">IV. Spiritual Rhythms</h3>
            <FieldLabel>A. Core Faith Identity</FieldLabel>
            <p className="text-xs text-plum-900/50 mb-2">
              Select the description that best captures your primary Christian
              background and current walk.
            </p>
            <ChoiceList
              options={CORE_FAITH_IDENTITY}
              value={data.coreFaithIdentity}
              onSelect={(v) => set("coreFaithIdentity", v)}
            />

            <FieldLabel>B. Select what anchors your personal walk with God</FieldLabel>
            <div className="text-xs uppercase tracking-widest text-plum-900/50 mb-2">
              Christian Rhythms
            </div>
            <div className="flex flex-wrap gap-2">
              {CHRISTIAN_RHYTHMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => set("interests", toggle(data.interests, item))}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    data.interests.includes(item)
                      ? "bg-plum-900 text-plum-100"
                      : "bg-plum-900/5 text-plum-900 hover:bg-plum-900/10"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === "journey" && (
        <div className="space-y-5">
          <h2 className="text-display text-2xl text-plum-900">
            Choose Your Journey
          </h2>
          <p className="text-sm text-plum-900/60">{JOURNEY_INTRO}</p>
          <p className="text-sm text-plum-900/60">
            Now, how would you like to take your next step?
          </p>
          <p className="text-sm text-plum-900/60">
            To move forward, simply choose the style of journey that matches your
            current lifestyle and schedule.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardTitle>{AMARI_PATH.title}</CardTitle>
              <CardSubtitle className="mt-1">{AMARI_PATH.meaning}</CardSubtitle>
              <p className="text-sm text-plum-900/70 mt-3">{AMARI_PATH.description}</p>
              <p className="text-xs font-medium text-plum-900/50 mt-4 uppercase tracking-widest">
                What&apos;s waiting for you:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-plum-900/70 list-disc pl-4">
                {AMARI_PATH.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="text-sm font-medium text-plum-900 mt-4">
                Cost: {AMARI_PATH.cost}
              </p>
              <AppLink href="/apply/amari" className="block mt-4">
                <Button className="w-full">Apply for Amari</Button>
              </AppLink>
            </Card>
            <Card className="border-amber/40">
              <CardTitle>{ZAHARI_PATH.title}</CardTitle>
              <CardSubtitle className="mt-1">{ZAHARI_PATH.meaning}</CardSubtitle>
              <p className="text-sm text-plum-900/70 mt-3">{ZAHARI_PATH.description}</p>
              <p className="text-xs font-medium text-plum-900/50 mt-4 uppercase tracking-widest">
                How the Zahari journey works:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-plum-900/70 list-disc pl-4">
                {ZAHARI_PATH.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="text-sm text-plum-900/70 mt-4">
                <span className="font-medium text-plum-900">Investment: </span>
                {ZAHARI_PATH.investment}
              </p>
              <AppLink href="/apply/zahari" className="block mt-4">
                <Button variant="outline" className="w-full">
                  Apply for Zahari
                </Button>
              </AppLink>
            </Card>
          </div>
        </div>
      )}

      {section !== "journey" && (
        <div className="mt-8 flex justify-between">
          <Button
            variant="ghost"
            type="button"
            onClick={back}
            disabled={step === 0 || pending}
          >
            ← Back
          </Button>
          <Button type="button" disabled={pending} onClick={next}>
            {pending ? "Saving…" : "Continue →"}
          </Button>
        </div>
      )}
    </div>
  );
}

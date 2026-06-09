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
  RELOCATION_OPENNESS,
  FAMILY_PLANNING,
  SPIRITUAL_RHYTHMS_HOME,
  DOCTRINAL_ALIGNMENT,
  PROFESSIONAL_RHYTHMS,
  FINANCIAL_STEWARDSHIP,
  ENVIRONMENT_PREFERENCE,
  HOSPITALITY_FLOW,
  FAMILY_STATUS_COMPATIBILITY,
  HOUSEHOLD_BLUEPRINT,
  INTEREST_PILLARS,
  CORE_FAITH_IDENTITY,
  HOUSEHOLD_LEADERSHIP,
  DOCTRINAL_FLEXIBILITY,
  type Option,
} from "@/lib/profile/create-profile";
import { saveStep } from "./actions";

type Profile = {
  firstName: string;
  lastName: string;
  gender: "man" | "woman" | "";
  birthYear: string;
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
  phone: string;
  altarTimeline: string;
  relocationOpenness: string;
  familyPlanningVision: string;
  spiritualRhythmsHome: string[];
  doctrinalAlignment: string;
  professionalRhythm: string;
  financialStewardship: string[];
  environmentPreference: string;
  hospitalityFlow: string;
  familyStatusCompatibility: string;
  householdBlueprint: string;
  interests: string[];
  coreFaithIdentity: string;
  householdLeadership: string;
  doctrinalFlexibility: string;
};

const SECTIONS = ["identity", "intent", "interests", "theological", "journey"] as const;
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
  const [customAliasMode, setCustomAliasMode] = useState(
    !!profile.personaAlias &&
      !allPresetPersonas.includes(profile.personaAlias),
  );
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const section = SECTIONS[step];
  const hasChildren = data.childrenCount !== "" && data.childrenCount !== "0";

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function toggle(arr: string[], v: string) {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  function persist(opts: { finalize?: boolean; toStep?: number } = {}) {
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
      "familyPlanningVision",
      "doctrinalAlignment",
      "professionalRhythm",
      "environmentPreference",
      "hospitalityFlow",
      "familyStatusCompatibility",
      "householdBlueprint",
      "coreFaithIdentity",
      "householdLeadership",
      "doctrinalFlexibility",
    ];
    for (const k of textKeys) fd.set(k, String(data[k] ?? ""));
    fd.set("divorceCertified", data.divorceCertified ? "1" : "0");
    fd.set("interests", JSON.stringify(data.interests));
    fd.set("spiritualRhythmsHome", JSON.stringify(data.spiritualRhythmsHome));
    fd.set("financialStewardship", JSON.stringify(data.financialStewardship));
    start(async () => {
      try {
        await saveStep(fd);
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
      if (!data.city.trim()) return "Current location is required.";
      if (!data.countryOfHeritage.trim()) return "Country of heritage is required.";
      if (!data.familialStatus) return "Familial status is required.";
      if (data.familialStatus === "divorced" && !data.divorceCertified)
        return "Please confirm the divorce certification to proceed.";
      if (data.childrenCount === "") return "Please indicate number of children.";
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
      if (!data.phone.trim()) return "Phone number is required.";
      return null;
    }
    if (section === "intent") {
      if (!data.altarTimeline) return "Please select your timeline to the altar.";
      if (!data.relocationOpenness) return "Please answer the relocation question.";
      if (!data.familyPlanningVision) return "Please select your family planning vision.";
      if (data.spiritualRhythmsHome.length === 0)
        return "Please select your spiritual rhythms in the home.";
      if (!data.doctrinalAlignment) return "Please select your doctrinal alignment.";
      if (!data.professionalRhythm) return "Please select your professional rhythm.";
      if (data.financialStewardship.length === 0)
        return "Please select your financial legacy & stewardship.";
      if (!data.environmentPreference) return "Please select your environment preference.";
      if (!data.hospitalityFlow) return "Please select your hospitality & social flow.";
      if (!data.familyStatusCompatibility)
        return "Please select your family status compatibility.";
      if (!data.householdBlueprint) return "Please select your household blueprint.";
      return null;
    }
    if (section === "interests") {
      if (data.interests.length === 0)
        return "Please select at least one interest.";
      return null;
    }
    if (section === "theological") {
      if (!data.coreFaithIdentity) return "Please select your core faith identity.";
      if (!data.householdLeadership)
        return "Please select your conviction on household leadership.";
      if (!data.doctrinalFlexibility)
        return "Please select your doctrinal non-negotiable.";
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
    const finalize = section === "theological";
    persist({ toStep: step + 1, finalize });
    setStep((s) => Math.min(s + 1, totalSteps - 1));
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
                <Label htmlFor="city">Current Location</Label>
                <Input
                  id="city"
                  value={data.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="countryOfHeritage">Country of Heritage</Label>
                <Input
                  id="countryOfHeritage"
                  value={data.countryOfHeritage}
                  onChange={(e) => set("countryOfHeritage", e.target.value)}
                />
              </div>
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
            <FieldLabel>Number of children</FieldLabel>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setOtherChildren(false);
                  set("childrenCount", "0");
                  set("childrenCustody", "");
                }}
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
                  onClick={() => {
                    setOtherChildren(false);
                    set("childrenCount", n);
                  }}
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
                  set("childrenCount", "");
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
                onChange={(e) => set("childrenCount", e.target.value)}
                placeholder="Number"
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
              This private name is not visible to others in the ecosystem until
              mutual alignment is confirmed.
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
                        !customAliasMode && data.personaAlias === p
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
                      Aliases are unique across the community — no two members
                      can share the same name.
                    </p>
                  </div>
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
            Relationship Intent
          </h2>
          <Alert tone="warning">{RELATIONSHIP_INTENT_WARNING}</Alert>

          <div>
            <FieldLabel>Your Timeline to the Altar</FieldLabel>
            <p className="text-xs text-plum-900/50 mb-2">
              Be completely honest about your current season.
            </p>
            <ChoiceList
              options={ALTAR_TIMELINE}
              value={data.altarTimeline}
              onSelect={(v) => set("altarTimeline", v)}
            />
          </div>

          <div className="border-t border-plum-900/10 pt-4">
            <h3 className="font-medium text-plum-900">Relational Non-Negotiables</h3>
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

            <FieldLabel>Family Planning Vision</FieldLabel>
            <ChoiceList
              options={FAMILY_PLANNING}
              value={data.familyPlanningVision}
              onSelect={(v) => set("familyPlanningVision", v)}
            />

            <FieldLabel>Spiritual Rhythms in the Home</FieldLabel>
            <MultiChoiceList
              options={SPIRITUAL_RHYTHMS_HOME}
              values={data.spiritualRhythmsHome}
              onToggle={(v) =>
                set("spiritualRhythmsHome", toggle(data.spiritualRhythmsHome, v))
              }
            />

            <FieldLabel>Doctrinal Alignment</FieldLabel>
            <ChoiceList
              options={DOCTRINAL_ALIGNMENT}
              value={data.doctrinalAlignment}
              onSelect={(v) => set("doctrinalAlignment", v)}
            />

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

            <FieldLabel>Environment Preference</FieldLabel>
            <ChoiceList
              options={ENVIRONMENT_PREFERENCE}
              value={data.environmentPreference}
              onSelect={(v) => set("environmentPreference", v)}
            />

            <FieldLabel>Hospitality &amp; Social Flow</FieldLabel>
            <ChoiceList
              options={HOSPITALITY_FLOW}
              value={data.hospitalityFlow}
              onSelect={(v) => set("hospitalityFlow", v)}
            />

            <FieldLabel>Current Family Status Compatibility</FieldLabel>
            <ChoiceList
              options={FAMILY_STATUS_COMPATIBILITY}
              value={data.familyStatusCompatibility}
              onSelect={(v) => set("familyStatusCompatibility", v)}
            />

            <FieldLabel>The Household Blueprint</FieldLabel>
            <ChoiceList
              options={HOUSEHOLD_BLUEPRINT}
              value={data.householdBlueprint}
              onSelect={(v) => set("householdBlueprint", v)}
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
            describe how you spend your time and build your life.
          </p>
          {INTEREST_PILLARS.map((pillar) => (
            <div key={pillar.pillar} className="border-t border-plum-900/10 pt-4">
              <h3 className="font-medium text-plum-900 mb-2">{pillar.pillar}</h3>
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
        </div>
      )}

      {section === "theological" && (
        <div className="space-y-5">
          <h2 className="text-display text-2xl text-plum-900">
            Theological Alignment
          </h2>
          <p className="text-sm text-plum-900/60">
            Ensuring your runway is anchored in the same truth.
          </p>

          <div>
            <FieldLabel>Core Faith Identity</FieldLabel>
            <p className="text-xs text-plum-900/50 mb-2">
              Select the description that best captures your primary Christian
              background and current walk.
            </p>
            <ChoiceList
              options={CORE_FAITH_IDENTITY}
              value={data.coreFaithIdentity}
              onSelect={(v) => set("coreFaithIdentity", v)}
            />
          </div>

          <div>
            <FieldLabel>Convictions on Household Leadership</FieldLabel>
            <p className="text-xs text-plum-900/50 mb-2">
              How do you believe a Christian household should be spiritually led?
            </p>
            <ChoiceList
              options={HOUSEHOLD_LEADERSHIP}
              value={data.householdLeadership}
              onSelect={(v) => set("householdLeadership", v)}
            />
          </div>

          <div>
            <FieldLabel>Doctrinal Non-Negotiables</FieldLabel>
            <p className="text-xs text-plum-900/50 mb-2">
              Where do you stand on theological differences?
            </p>
            <ChoiceList
              options={DOCTRINAL_FLEXIBILITY}
              value={data.doctrinalFlexibility}
              onSelect={(v) => set("doctrinalFlexibility", v)}
            />
          </div>
        </div>
      )}

      {section === "journey" && (
        <div className="space-y-5">
          <h2 className="text-display text-2xl text-plum-900">
            Choose Your Journey
          </h2>
          <p className="text-sm text-plum-900/60">
            Your profile is saved. Select the pathway you wish to apply for —
            applications are reviewed before you enter the ecosystem.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardTitle>Amari · The Fellowship</CardTitle>
              <CardSubtitle className="mt-2">
                Vibrant community, Evermore Socials, Pulse retreats, and Match
                Cards — complimentary entry.
              </CardSubtitle>
              <AppLink href="/apply/amari" className="block mt-4">
                <Button className="w-full">Apply for Amari</Button>
              </AppLink>
            </Card>
            <Card className="border-amber/40">
              <CardTitle>Zahari · The Private Circle</CardTitle>
              <CardSubtitle className="mt-2">
                White-glove concierge matching for high-profile professionals
                requiring absolute discretion.
              </CardSubtitle>
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

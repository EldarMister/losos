"use client";
import { useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Icon } from "@mdi/react";
import { mdiCheck, mdiChevronDown, mdiChevronUp, mdiWeb } from "@mdi/js";
import { useSiteLanguage } from "../lib/site-i18n/react";
import { setSiteLanguage, siteLanguages, translateSite as t } from "../lib/site-i18n/store";
import "./site-language.css";

export function SiteLanguageSelector({ light = false }: { light?: boolean }) {
  const language = useSiteLanguage();
  const [open, setOpen] = useState(false);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const selected = siteLanguages.find(item => item.code === language)!;
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Trigger type="button" className={`site-language-trigger${light ? " site-language-light" : ""}`} aria-label={`${t("Язык сайта")}: ${selected.label}`}>
      <Icon path={mdiWeb} size={0.96} aria-hidden="true" /><span lang={selected.code}>{selected.label}</span><Icon path={open ? mdiChevronUp : mdiChevronDown} size={1} aria-hidden="true" />
    </Popover.Trigger>
    <Popover.Portal><Popover.Positioner side="top" align="center" sideOffset={8} collisionPadding={16} className="site-language-positioner">
      <Popover.Popup className="site-language-menu" aria-label={t("Выберите язык")} initialFocus={selectedRef}>
        <div role="radiogroup" aria-label={t("Язык сайта")}>{siteLanguages.map(item => <button type="button" role="radio" lang={item.code} key={item.code} ref={item.code === language ? selectedRef : undefined} aria-checked={item.code === language} className="site-language-option" onClick={() => { setSiteLanguage(item.code); setOpen(false); }}>
          <span>{item.label}</span>{item.code === language && <Icon path={mdiCheck} size={0.92} aria-hidden="true" />}
        </button>)}</div>
      </Popover.Popup>
    </Popover.Positioner></Popover.Portal>
  </Popover.Root>;
}

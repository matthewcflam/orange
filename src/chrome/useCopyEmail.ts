import { play } from "../audio/engine";
import { copyText } from "../lib/clipboard";
import { EMAIL } from "../content/contact";
import { useToast } from "./useToast";

/**
 * Copy the email address and show the "copied" toast (HOME.TOAST_*). Put
 * `toastRef` on a status element that renders "email copied to clipboard!"
 * while `copied` is true.
 */
export function useCopyEmail() {
  const { toastRef, shown: copied, show } = useToast();

  const copyEmail = async () => {
    const ok = await copyText(EMAIL);
    if (!ok) return;
    play("project.select");
    show();
  };

  return { copyEmail, toastRef, copied };
}

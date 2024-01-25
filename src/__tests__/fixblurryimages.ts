import { replaceInFile as replace } from 'replace-in-file';

export async function fixBlurryImages() {
  const options = {
    files: './public/js/app.js',
    from: /(p\(i,e\);)(let o=await k\(r,e,i\),a=o.toDataURL\("image\/jpeg"\);)/g,
    to: `$1(i.height>2880?(e.height=2880,e.width=Math.floor(2880*i.width/i.height),(i.width>3840??(e.height=Math.floor(3840*i.height/i.width),e.width=3840))):(e.width=i.width,e.height=i.height)),document.dispatchEvent(new CustomEvent("ping", { detail: { type: "toast", msg: "higher resolution captured ✅" } }));$2`,
  }

  return await replace(options);
}
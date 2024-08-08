import { replaceInFile as replace } from 'replace-in-file'

export async function fixBlurryImages() {
  const options = {
    files: './public/js/app.js',
    from: /(l\(n,e\);)(let r=\(await h\(n,e,i\)\).toDataURL\("image\/jpeg"\);)/g,
    to: `$1(n.height>2880?(e.height=2880,e.width=Math.floor(2880*n.width/n.height),(n.width>3840??(e.height=Math.floor(3840*n.height/n.width),e.width=3840))):(e.width=n.width,e.height=n.height)),document.dispatchEvent(new CustomEvent("ping", { detail: { type: "toast", msg: "higher resolution captured ✅" } }));$2`,
  }

  return await replace(options)
}
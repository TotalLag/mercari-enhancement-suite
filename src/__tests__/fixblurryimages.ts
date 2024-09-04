import { replaceInFile as replace } from 'replace-in-file'

export async function fixBlurryImages() {
  const options = {
    files: './public/js/app.js',
    from: /(ep\(ei,et\);)(let eu=\(await ek\(ei,et,eo\)\).toDataURL\("image\/jpeg"\);)/g,
    to: `$1(ei.height>2880?(et.height=2880,et.width=Math.floor(2880*ei.width/ei.height),(ei.width>3840??(et.height=Math.floor(3840*ei.height/ei.width),et.width=3840))):(et.width=ei.width,et.height=ei.height)),document.dispatchEvent(new CustomEvent("ping", { detail: { type: "toast", msg: "higher resolution captured ✅" } }));$2`,
  }

  return await replace(options)
}

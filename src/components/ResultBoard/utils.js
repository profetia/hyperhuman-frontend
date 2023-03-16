import html2canvas from "html2canvas";

export async function exportToImage(element, filenameNoExt) {
  let canvas = await html2canvas(element, {
    allowTaint: true,
    useCORS: true,
  });
  let data = canvas.toDataURL("image/jpg");
  let link = document.createElement("a");

  link.href = data;
  link.download = `${filenameNoExt}.jpg`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

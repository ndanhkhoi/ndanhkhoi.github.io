/* The CV data spells the name in caps because that is how it is set on the A4
   sheet. On screen - in the header and at hero size - caps read as shouting and
   wrap badly on a phone, so the web rendering title-cases it. Same name in the
   data, one presentation per medium.

   Unicode-aware so a Vietnamese spelling (Nguyễn Đức Anh Khôi) title-cases
   correctly too. */
export function titleCase(value: string): string {
  return value
    .toLocaleLowerCase("en")
    .replace(/(^|[\s\-'])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("en"));
}

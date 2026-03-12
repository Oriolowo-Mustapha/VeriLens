import keywordExtractor from 'keyword-extractor';

export function extractKeywordsFromClaim(claim: string): string {
  const extraction = keywordExtractor.extract(claim, {
    language: 'english',
    remove_digits: true,
    return_changed_case: false,
    remove_duplicates: true,
  });
  return extraction.join(' ');
}

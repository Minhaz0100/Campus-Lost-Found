const FAQS = [
  {
    q: 'How do I report a lost item?',
    a: 'Login to your account, click "Report Item", select "Lost", fill in the details, upload photos, and submit. Our AI will automatically search for matching found items.',
  },
  {
    q: 'How does AI matching work?',
    a: 'When you upload a photo, our system analyzes image features, keywords, and category to find similar items. You can also use the AI Match page to search by photo.',
  },
  {
    q: 'How do I claim a found item?',
    a: 'Find the item, click "Claim This Item", provide proof of ownership, and answer the verification quiz. An admin will review your claim.',
  },
  {
    q: 'What is the verification quiz?',
    a: 'When reporting an item, the system generates questions only the true owner would know (e.g., description details, location keywords). Claimants must answer correctly.',
  },
  {
    q: 'Can I post anonymously?',
    a: 'Yes! When reporting an item, check the "Post anonymously" option. Your name will be hidden from other users.',
  },
  {
    q: 'What are emergency alerts?',
    a: 'Critical items like ID cards, laptops, passports, and wallets trigger instant notifications to admins and get priority visibility.',
  },
  {
    q: 'How does the reputation system work?',
    a: 'Users earn reputation points for successful item returns. Badges like "Helpful Finder" and "Campus Hero" are awarded at milestones.',
  },
  {
    q: 'What is the QR code for?',
    a: 'Each item gets a unique QR code. Print and attach it to found items so anyone can scan and contact the owner directly.',
  },
];

export default function FAQ() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="card p-4 group">
            <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
              {q}
              <span className="text-primary-600 group-open:rotate-45 transition-transform text-xl">+</span>
            </summary>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export type LegalSection = {
  title: string
  paragraphs?: string[]
  items?: string[]
  closingParagraphs?: string[]
  contact?: {
    address: string
  }
}

export type LegalPageContent = {
  title: string
  description: string
  effectiveDate?: string
  introduction?: string[]
  sections: LegalSection[]
}

export const legalPages = {
  privacy: {
    title: 'Privacy Policy',
    description: 'How Arelia Space collects, uses, and protects your information.',
    effectiveDate: '19th August 2026',
    introduction: [
      'ARELIA Space ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect information when you visit https://areliaspace.com/.',
    ],
    sections: [
      { title: 'Information We Collect', paragraphs: ['We may collect information you provide through our website, such as your name, email address, phone number, project details, and other information submitted through contact or inquiry forms. We may also automatically collect basic website usage information, such as IP address, browser type, device information, and pages visited.'] },
      { title: 'How We Use Information', paragraphs: ['We use your information to:'], items: ['Respond to inquiries and requests', 'Provide and improve our services', 'Communicate with you about projects or services', 'Improve website functionality and user experience', 'Maintain website security', 'Meet applicable legal requirements'] },
      { title: 'Cookies', paragraphs: ['We may use cookies and analytics tools to improve website performance and understand visitor activity. You can manage or disable cookies through your browser settings.'] },
      { title: 'Sharing Information', paragraphs: ['We do not sell or rent your personal information. We may share information with trusted service providers who help us operate our website and business, or when required by law.'] },
      { title: 'Data Security', paragraphs: ['We take reasonable steps to protect your personal information from unauthorized access, misuse, or disclosure. However, no online system can be guaranteed to be completely secure.'] },
      { title: 'Your Privacy Rights', paragraphs: ['You may request access to, correction of, or deletion of your personal information. To make a request, email us at info@areliaspace.com with the subject "Privacy Request." We may verify your identity before processing the request.'] },
      { title: 'Third-Party Links', paragraphs: ['Our website may contain links to third-party websites. We are not responsible for their privacy practices and recommend reviewing their privacy policies.'] },
      { title: 'Updates', paragraphs: ['We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.'] },
      { title: 'Contact Us', contact: { address: 'Unit No 1204, Forest Department, Asian Sun City, Block B, Kondapur, Hyderabad 500084' } },
      { title: 'Important Note', paragraphs: ["This Privacy Policy should be customized based on ARELIA Space's actual data collection practices, cookies, analytics, and applicable legal requirements."] },
    ],
  },
  terms: {
    title: 'Terms of Service',
    description: 'The terms that apply when you access and use the Arelia Space website.',
    effectiveDate: '19th August 2026',
    introduction: ['By using the ARELIA Space website, https://areliaspace.com/, you agree to these Terms & Conditions.'],
    sections: [
      { title: 'Website Use', paragraphs: ['Please use our website only for lawful purposes. Do not misuse the website, attempt unauthorized access, or copy our content without permission.'] },
      { title: 'Services', paragraphs: ['Information about our interior design services, projects, pricing, and availability is provided for general information. Final pricing, scope, timelines, and deliverables will be agreed upon separately with the client.'] },
      { title: 'Intellectual Property', paragraphs: ['All designs, images, logos, text, and other content on this website belong to ARELIA Space or their respective owners. They may not be copied or used without prior permission.'] },
      { title: 'Third-Party Links', paragraphs: ['Our website may contain links to third-party websites. ARELIA Space is not responsible for their content, security, or privacy practices.'] },
      { title: 'Website Availability', paragraphs: ['We aim to keep our website accurate and available, but we do not guarantee uninterrupted or error-free access.'] },
      { title: 'Limitation of Liability', paragraphs: ['To the extent permitted by law, ARELIA Space is not responsible for losses arising from the use of, or inability to use, this website.'] },
      { title: 'Privacy', paragraphs: ['Your use of the website is also subject to our Privacy Policy, which explains how we handle your personal information.'] },
      { title: 'Changes', paragraphs: ['We may update these Terms & Conditions at any time. Updated terms will be posted on this page.'] },
      { title: 'Governing Law', paragraphs: ['These Terms & Conditions are governed by the laws of India. Disputes will be subject to the applicable courts in Hyderabad, Telangana.'] },
      { title: 'Contact Us', contact: { address: 'Unit No 1204, Asian Sun City, Kondapur, Hyderabad, Telangana 500084' } },
      { title: 'Acknowledgement', paragraphs: ['By using our website, you acknowledge that you have read and agreed to these Terms & Conditions.'] },
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    description: 'Important information about website content, project representations, and liability.',
    sections: [
      { title: 'Disclaimer', paragraphs: ['The information provided on this website is for general informational purposes only. While we strive to keep all information accurate, complete, and up to date, Arelia makes no representations or warranties of any kind, express or implied, regarding the accuracy, reliability, suitability, or availability of the website or the information, products, services, or related graphics contained on the website.', 'Any reliance you place on such information is strictly at your own risk.', 'Project images, 3D designs, renderings, layouts, and visualizations displayed on this website are intended for illustrative purposes only. Final designs, materials, colors, dimensions, finishes, pricing, and project scope may vary based on client requirements, site conditions, material availability, and other factors.', 'All quotations, estimates, timelines, and project costs are subject to change without prior notice and are provided based on the information available at the time of preparation.', 'This website may contain links to third-party websites for your convenience. Arelia does not endorse or assume responsibility for the content, privacy practices, or availability of any third-party websites.', 'To the fullest extent permitted by applicable law, Arelia shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from the use of, or inability to use, this website or any information contained herein.', 'All content, including text, graphics, logos, photographs, designs, videos, and other materials published on this website, is the intellectual property of Arelia or its licensors and may not be copied, reproduced, distributed, modified, or used without prior written permission.', 'By accessing and using this website, you acknowledge that you have read, understood, and agreed to this Disclaimer.'] },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    description: 'How Arelia uses cookies and similar technologies on this website.',
    sections: [
      { title: 'Cookie Policy', paragraphs: ['Arelia uses cookies and similar technologies to enhance your browsing experience, improve website performance, and provide personalized services. These cookies help us remember your preferences, maintain secure sessions, analyze website traffic, and optimize our services.', 'We use:'], items: ['Essential Cookies – Required for the website to function properly.', 'Analytics Cookies – Help us understand how visitors use our website to improve user experience.', 'Functional Cookies – Remember your preferences and settings.'], closingParagraphs: ['You can manage or disable cookies through your browser settings at any time. Please note that disabling certain cookies may affect the functionality of the website.', 'By continuing to use the Arelia website, you consent to our use of cookies in accordance with this Cookie Policy.'] },
    ],
  },
} satisfies Record<string, LegalPageContent>

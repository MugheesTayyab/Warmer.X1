import { SampleScene, FailureCase } from '../types';

export const SAMPLE_SCENES: SampleScene[] = [
  {
    id: 'junk_drawer',
    title: 'Messy Household Junk Drawer',
    category: 'Household Clutter',
    description: '40+ items piled together: mail, keychains, coins, batteries, USB drives, pens, scissors.',
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=1200&q=80',
    defaultQuery: 'find my brass keys, not my roommate silver keychain',
    difficulty: 'Extreme Clutter',
  },
  {
    id: 'garage_pegboard',
    title: 'Garage Pegboard & Tool Rack',
    category: 'Tools & Workshop',
    description: 'Row of near-identical chrome sockets and wrenches on a wooden pegboard.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    defaultQuery: 'find the 10mm socket, not the 12mm',
    difficulty: 'Medium',
  },
  {
    id: 'tangled_cables',
    title: 'Tangled Charger & Cable Drawer',
    category: 'Electronics',
    description: 'A massive tangle of black, white, and braided charging cords and power bricks.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    defaultQuery: 'find the braided USB-C cable with red accents',
    difficulty: 'Extreme Clutter',
  },
  {
    id: 'couch_cushion',
    title: 'Couch Cushion Crevice',
    category: 'Living Room',
    description: 'Overlapping blankets, cushions, crumbs, remote controls, and a kid inhaler.',
    imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80',
    defaultQuery: 'find my daughter red asthma inhaler',
    difficulty: 'Medium',
  },
  {
    id: 'office_desk',
    title: 'Messy Office Desk',
    category: 'Workspace',
    description: 'Stacked notebooks, sticky notes, wireless earbuds case, reading glasses, pens.',
    imageUrl: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&w=1200&q=80',
    defaultQuery: 'find my black leather wallet under the mail',
    difficulty: 'Easy',
  }
];

export const FAILURE_CASES: FailureCase[] = [
  {
    id: 'fail_1',
    title: '75% Occlusion Under Dark Fabric',
    category: 'Occlusion',
    scenario: 'Black leather wallet buried under a heavy wool coat inside a dark backpack.',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    whyItFailed: 'Only 15% of key visual surface exposed; feature embeddings overlap with inner lining of bag.',
    systemMitigation: 'Warmer flags status as "AMBIGUOUS / HIGH OCCLUSION (28% confidence)". Prompted user: "Sweep camera angle 30 degrees right or lift top layer".',
    lessonLearned: 'Always expose an "unsure" confidence fallback path rather than forcing a low-confidence false positive.'
  },
  {
    id: 'fail_2',
    title: 'Direct Sun Glare & Specular Reflection',
    category: 'Reflections & Glare',
    scenario: 'Polished chrome socket wrench under direct sunlight on a workshop bench.',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80',
    whyItFailed: 'Specular highlight blown out 255-white pixels, erasing laser-etched "10mm" text.',
    systemMitigation: 'Activated dynamic contrast normalization pass & polarized edge filter before SAM 3 feature extraction.',
    lessonLearned: 'Hardware pre-processing filters significantly improve robustness against outdoor glare.'
  },
  {
    id: 'fail_3',
    title: '30 Identical Black USB-C Cables',
    category: 'Mass Production Duplicates',
    scenario: 'Box of unlabelled factory cables with identical molded plastic connectors.',
    imageUrl: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=800&q=80',
    whyItFailed: 'No semantic or visual distinction exists between cable #4 and cable #12.',
    systemMitigation: 'System highlights all 3 candidates with disambiguation tags ("Cable A: 1.5m coiled", "Cable B: Straight 0.5m").',
    lessonLearned: 'When semantic disambiguation is impossible, present top candidates transparently instead of guessing.'
  },
  {
    id: 'fail_4',
    title: 'Rapid Camera Motion Blur',
    category: 'Motion Blur',
    scenario: 'User sweeping phone rapidly over a cluttered drawer at 1.2 m/s.',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    whyItFailed: 'Blur radius > 18 pixels degraded feature detection scores by 62%.',
    systemMitigation: 'On-device motion-gated frame sampler dropped blurred frames automatically until camera stabilized.',
    lessonLearned: 'Gating inference by IMU/optical motion vectors saves GPU cycles and prevents garbage detections.'
  }
];

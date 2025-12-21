
import { useRef } from "react";
import { motion, useScroll, useTransform } from 'framer-motion';
import OptimizedImage from '@/components/OptimizedImage';

export default function ParallaxScrollFeature({ sections }) {
    // Create refs and animations for each section
    const sectionRefs = sections.map(() => useRef(null));
    
    const scrollYProgress = sections.map((_, index) => {
        return useScroll({
            target: sectionRefs[index],
            offset: ["start end", "center start"]
        }).scrollYProgress;
    });

    // Create animations for each section
    const opacityContents = scrollYProgress.map(progress => 
        useTransform(progress, [0, 0.7], [0, 1])
    );
    
    const clipProgresses = scrollYProgress.map(progress => 
        useTransform(progress, [0, 0.7], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"])
    );
    
    const translateContents = scrollYProgress.map(progress => 
        useTransform(progress, [0, 1], [-50, 0])
    );

    return (
        <div className="flex flex-col md:px-0 px-10">
            {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                    <div 
                        key={section.id}
                        ref={sectionRefs[index]} 
                        className={`min-h-screen flex items-center justify-center md:gap-40 gap-20 py-20 ${section.reverse ? 'md:flex-row-reverse flex-col-reverse' : 'flex-col md:flex-row'}`}
                    >
                        <motion.div style={{ y: translateContents[index] }} className="max-w-md">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center">
                                    <Icon className="w-8 h-8 text-blue-400" />
                                </div>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">{section.title}</h2>
                            <motion.p 
                                style={{ y: translateContents[index] }} 
                                className="text-white/70 text-lg leading-relaxed mb-6"
                            >
                                {section.description}
                            </motion.p>
                            <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-white/10 to-white/5 border border-white/10">
                                <span className="text-white font-semibold">{section.stats}</span>
                            </div>
                            {section.source && (
                                <p className="text-white/50 text-sm mt-4">Source: {section.source}</p>
                            )}
                        </motion.div>
                        <motion.div 
                            style={{ 
                                opacity: opacityContents[index],
                                clipPath: clipProgresses[index],
                            }}
                            className="relative"
                        >
                            <OptimizedImage
                                src={section.imageUrl}
                                alt={section.title}
                                width={500}
                                className="w-[500px] h-[400px] object-cover rounded-2xl shadow-2xl"
                            />
                        </motion.div>
                    </div>
                );
            })}
        </div>
    );
}

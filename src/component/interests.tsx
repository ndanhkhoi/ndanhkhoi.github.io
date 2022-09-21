import React from 'react';

const Interests: React.FC<{interests: Array<String>}> = ({interests}) => {

    return (
        <section className="skills-section py-3">
            <h3 className="text-uppercase resume-section-heading mb-4">Interests</h3>
            <ul className="unstyled resume-interests-list mb-0">
                {
                    interests.map((interest, idx) => {
                        return (
                            <li key={idx} className="mb-2">{interest}</li>
                        );
                    })
                }
            </ul>
        </section>
    );

}

export default Interests;
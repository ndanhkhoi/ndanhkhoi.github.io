import React from 'react';
import ISkill from "../model/skill.model";

const Skill: React.FC<{skill: ISkill}> = ({skill}) => {

    return (
        <section className="skills-section py-3">
            <h3 className="text-uppercase resume-section-heading mb-4">Skills</h3>
            <div className="item">
                <h4 className="item-title">Technical</h4>
                <ul className="unstyled resume-skills-list">
                    {skill.technical.map((technical, idx) => (
                        <li key={idx} className="mb-2">{technical}</li>
                    ))}
                </ul>
            </div>
            <div className="item">
                <h4 className="item-title">Professional</h4>
                <ul className="unstyled resume-skills-list">
                    {skill.professional.map((professional, idx) => (
                        <li key={idx} className="mb-2">{professional}</li>
                    ))}
                </ul>
            </div>
        </section>
    );

}

export default Skill;
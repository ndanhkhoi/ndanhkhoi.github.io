import React from 'react';
import ISkill from "../model/skill.model";
import {List} from 'reactstrap';

const Skill: React.FC<{skill: ISkill}> = ({skill}) => {

    return (
        <section className="skills-section py-3">
            <h3 className="text-uppercase resume-section-heading mb-4">Skills</h3>
            <div className="item">
                <h4 className="item-title">Technical</h4>
                <List type="unstyled" className="resume-skills-list">
                    {skill.technical.map((technical, idx) => (
                        <li key={idx} className="mb-2">{technical}</li>
                    ))}
                </List>
            </div>
            <div className="item">
                <h4 className="item-title">Professional</h4>
                <List type="unstyled" className="resume-skills-list">
                    {skill.professional.map((professional, idx) => (
                        <li key={idx} className="mb-2">{professional}</li>
                    ))}
                </List>
            </div>
        </section>
    );

}

export default Skill;
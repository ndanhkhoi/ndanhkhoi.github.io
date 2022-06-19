import React from 'react';
import ILanguage from '../model/language.model';
import {List} from 'reactstrap';

const Languages: React.FC<{languages: Array<ILanguage>}> = ({languages}) => {

    return (
        <section className="skills-section py-3">
            <h3 className="text-uppercase resume-section-heading mb-4">Languages</h3>
            <List type="unstyled" className={'resume-lang-list'}>
                {
                    languages.map((language, idx) => {
                        return (
                            <li key={idx} className="mb-2">
                                {language.name + ' '}
                                <span className="text-muted">({language.level})</span>
                            </li>
                        );
                    })
                }
            </List>
        </section>
    );

}

export default Languages;
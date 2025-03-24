import Joi from 'joi';
export const buildSchema=(config)=>{
    const schemaMap={};

    for(const key in config){
        const rules=config[key];
        let validator;

        switch(rules.type){
            case 'string':
                validator=Joi.string();
                if(rules.email){
                    validator=validator.email();
                }
                if (rules.trim) {
                    validator=validator.trim();
                }
                if (rules.lowercase) {
                    validator=validator.lowercase();
                }
                break;


            case 'number':
                validator=Joi.number();
                break;
            case 'date':
                validator=Joi.date();
                break;
            default:
                validator=Joi.any();
        }

        // Additional Rules 

        if(rules.min !==undefined){
            validator=validator.min(rules.min);
        }
        if(rules.min!==undefined){
            validator=validator.max(rules.max);
        }
        if (rules.required) {
            validator=validator.required();
        }
        if(rules.pattern){
            validator=validator.pattern(rules.pattern);                 //For regular regex Pattern
        }

        schemaMap[key]=validator;
    }

    return Joi.object(schemaMap);
}

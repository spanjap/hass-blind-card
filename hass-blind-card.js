class BlindCard extends HTMLElement {
  set hass(hass) {
    const _this = this;
    const entities = this.config.entities;
    
    //Init the card
    if (!this.card) {
      const card = document.createElement('ha-card');


      if (this.config.title) {
          card.header = this.config.title;
      }
    
      this.card = card;
      this.appendChild(card);
    
      let allBlinds = document.createElement('div');
      allBlinds.className = 'sc-blinds';
      entities.forEach(function(entity) {
        let entityId = entity;
        if (entity && entity.entity) {
            entityId = entity.entity;
        }
        
        let buttonsPosition = 'left';
        if (entity && entity.buttons_position) {
            buttonsPosition = entity.buttons_position.toLowerCase();
        }
        
        let titlePosition = 'top';
        if (entity && entity.title_position) {
            titlePosition = entity.title_position.toLowerCase();
        }

        let invertPercentage = false;
        if (entity && entity.invert_percentage) {
          invertPercentage = entity.invert_percentage;
        }

        let blindColor = '#ffffff'
        if (entity && entity.blind_color) {
          blindColor = entity.blind_color;
        }
    
        let blind = document.createElement('div');

        blind.className = 'sc-blind';
        blind.dataset.blind = entityId;
        blind.innerHTML = `
          <div class="sc-blind-top" ` + (titlePosition == 'bottom' ? 'style="display:none;"' : '') + `>
            <div class="sc-blind-label">
            
            </div>
            <div class="sc-blind-position">
            
            </div>
          </div>
          <div class="sc-blind-middle" style="flex-direction: ` + (buttonsPosition == 'right' ? 'row-reverse': 'row') + `;">
            <div class="sc-blind-buttons">
              <ha-icon-button class="sc-blind-button" data-command="up"><ha-icon icon="mdi:arrow-up"></ha-icon></ha-icon-button><br>
              <ha-icon-button class="sc-blind-button" data-command="stop"><ha-icon icon="mdi:stop"></ha-icon></ha-icon-button><br>
              <ha-icon-button class="sc-blind-button" data-command="down"><ha-icon icon="mdi:arrow-down"></ha-icon></ha-icon-button>
            </div>
            <div class="sc-blind-selector">
              <div class="sc-blind-selector-picture">
                <div class="sc-blind-selector-slide"></div>
                <div class="sc-blind-selector-picker"></div>
              </div>
            </div>
          </div>
          <div class="sc-blind-bottom" ` + (titlePosition != 'bottom' ? 'style="display:none;"' : '') + `>
            <div class="sc-blind-label">
            
            </div>
            <div class="sc-blind-position">
            
            </div>
          </div>
        `;
        
        let picture = blind.querySelector('.sc-blind-selector-picture');
        let slide = blind.querySelector('.sc-blind-selector-slide');
        let picker = blind.querySelector('.sc-blind-selector-picker');

        slide.style.background = blindColor ;
        
        let mouseDown = function(event) {
            if (event.cancelable) {
              //Disable default drag event
              event.preventDefault();
            }
            
            _this.isUpdating = true;
            
            document.addEventListener('mousemove', mouseMove);
            document.addEventListener('touchmove', mouseMove);
            document.addEventListener('pointermove', mouseMove);
      
            document.addEventListener('mouseup', mouseUp);
            document.addEventListener('touchend', mouseUp);
            document.addEventListener('pointerup', mouseUp);
        };
  
        let mouseMove = function(event) {
          let newPosition = event.pageY - _this.getPictureTop(picture);
          _this.setPickerPosition(newPosition, picker, slide);
        };
           
        let mouseUp = function(event) {
          _this.isUpdating = false;
            
          let newPosition = event.pageY - _this.getPictureTop(picture);
          
          if (newPosition < _this.minPosition)
            newPosition = _this.minPosition;
          
          if (newPosition > _this.maxPosition)
            newPosition = _this.maxPosition;
          
          let percentagePosition = (newPosition - _this.minPosition) * 100 / (_this.maxPosition - _this.minPosition);
          
          if (invertPercentage) {
            _this.updateBlindPosition(hass, entityId, percentagePosition);
          } else {
            _this.updateBlindPosition(hass, entityId, 100 - percentagePosition);
          }
          
          document.removeEventListener('mousemove', mouseMove);
          document.removeEventListener('touchmove', mouseMove);
          document.removeEventListener('pointermove', mouseMove);
      
          document.removeEventListener('mouseup', mouseUp);
          document.removeEventListener('touchend', mouseUp);
          document.removeEventListener('pointerup', mouseUp);
        };
      
        //Manage slider update
        picker.addEventListener('mousedown', mouseDown);
        picker.addEventListener('touchstart', mouseDown);
        picker.addEventListener('pointerdown', mouseDown);
        
        //Manage click on buttons
        blind.querySelectorAll('.sc-blind-button').forEach(function (button) {
            button.onclick = function () {
                const command = this.dataset.command;
                
                let service = '';
                
                switch (command) {
                  case 'up':
                      service = 'open_cover';
                      break;
                      
                  case 'down':
                      service = 'close_cover';
                      break;
                
                  case 'stop':
                      service = 'stop_cover';
                      break;
                }
                
                hass.callService('cover', service, {
                  entity_id: entityId
                });
            };
        });
      
        allBlinds.appendChild(blind);
      });
      
      
      const style = document.createElement('style');
      style.textContent = `
        .sc-blinds { padding: 16px; }
          .sc-blind { margin-top: 1rem; overflow: hidden; }
          .sc-blind:first-child { margin-top: 0; }
          .sc-blind-middle { display: flex; max-width: 210px; width: 100%; margin: auto; }
            .sc-blind-buttons { flex: 0; text-align: center; margin-top: 0.4rem; }
            .sc-blind-selector { flex: 1; }
              .sc-blind-selector-picture { position: relative; margin: auto; background-size: 100% 100%; background-repeat: no-repeat; min-height: 151px; max-height: 100%; width: 100%; max-width: 153px; }
                .sc-blind-selector-picture { background-image: url(data:@file/png;base64,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); }
              .sc-blind-selector-slide { background-color: #ffffff; position: absolute; top: 19px; left: 6%; width: 88%; height: 0; }
              .sc-blind-selector-picker { position: absolute; top: 19px; left: 6%; width: 88%; cursor: pointer; height: 20px; background-repeat: no-repeat; }
                .sc-blind-selector-picker { background-image: url(data:@file/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAAAHCAYAAADuzmQ5AAAABGdBTUEAALGeYUxB9wAAACBjSFJNAACHCwAAjBIAAP70AAB/DgAAgQYAAOhBAAA54AAAHiqESS3PAAAA22lDQ1BJQ0MgUHJvZmlsZQAAKM9jYGB8wAAETECcm1dSFOTupBARGaXAfoGBEQjBIDG5uMA32C2EASf4dg2i9rIuA+mAs7ykoARIfwBikaKQIGegm1iAbL50CFsExE6CsFVA7CKgA4FsE5D6dAjbA8ROgrBjQOzkgiKgmYwFIPNTUouTgewGIDsB5DeItZ9ZwW5mFFVKLi0qg7qFkcmYgYEQH2FGHjsDg9lVBgbm/Qix1G4Ghm0nGRjE5RBiykC3CyUyMOxIKkmtKEH2PMRtYMCWXwAMfQZqAgYGAC7ONG+WT8jJAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAB5klEQVRYR+2XwWrCQBCGs2li7KmQCqJ46qVv0KeofRZfpM/Qk4fqQ0jRkydBBKGnHnopNmJiAjFp0v9Ps2UrEmyLtEI+GGYzOzMbsz+bKObzeadWq91qJSW/wPf9O8/zZmIymXTr9XrbNM0q4inQhBAfWcWkMAO5ES/gN6xDfTVJkhOEYoY5V/L/Ufed3rKsLBaG4Zc5iYzpus5x4jjOwnXdoRiNRv1Go9E2DMOSibsaFMGG+TADtXo+LDki1L2nUAh0oUVRtFMTjOWCSiEmZ71eD8R4PL5vtVo3KKwyQdq+gkLuGxwFxVOJp5Y8ueBKjg3ufRzHWqVSyTwFhTdONlcgqGS5XC7wynsQ0+m032w222iQnVD7ojRzsZCBRSlprmjiujyhjhApJgqHe0u/LSIVqQHsfYpXngNBDfjK6+Kj/Fp+QzGxqIkEzVI009EsQD7FyNoNzKQhniBOcFlyCLihNMLn/JNnLXuwFj6FoNjEkv1gIdPgSVYjYV1+qCSr1eoVghqKXq/XsW37CoIymQAdZEl7wF9yDouxUB3mo/6J94TYqdrnGz3/HHmv8uHJZ0LUuITzpCjnUGzv1/a9F6HUYphmDeA91D7DXjDmn6wL+DNMPcJf4tqGfX4vK+vxG8oNgmD2Di0RPo9DidC/AAAAAElFTkSuQmCC); }
          .sc-blind-top { text-align: center; margin-bottom: 1rem; }
          .sc-blind-bottom { text-align: center; margin-top: 1rem; }
            .sc-blind-label { display: inline-block; font-size: 20px; vertical-align: middle; }
            .sc-blind-position { display: inline-block; vertical-align: middle; padding: 0 6px; margin-left: 1rem; border-radius: 1px; background-color: var(--secondary-background-color); }
      `;
    
      this.card.appendChild(allBlinds);
      this.appendChild(style);
    }
    
    //Update the blinds UI
    entities.forEach(function(entity) {
      let entityId = entity;
      if (entity && entity.entity) {
        entityId = entity.entity;
      }

      let invertPercentage = false;
      if (entity && entity.invert_percentage) {
        invertPercentage = entity.invert_percentage;
      }
        
      const blind = _this.card.querySelector('div[data-blind="' + entityId +'"]');
      const slide = blind.querySelector('.sc-blind-selector-slide');
      const picker = blind.querySelector('.sc-blind-selector-picker');
        
      const state = hass.states[entityId];
      const friendlyName = (entity && entity.name) ? entity.name : state ? state.attributes.friendly_name : 'unknown';
      const currentPosition = state ? state.attributes.current_position : 'unknown';

      blind.querySelectorAll('.sc-blind-label').forEach(function(blindLabel) {
          blindLabel.innerHTML = friendlyName;
      })
      
      if (!_this.isUpdating) {
        blind.querySelectorAll('.sc-blind-position').forEach(function (blindPosition) {
          blindPosition.innerHTML = currentPosition + '%';
        })

        if (invertPercentage) {
          _this.setPickerPositionPercentage(currentPosition, picker, slide);
        } else {
          _this.setPickerPositionPercentage(100 - currentPosition, picker, slide);
        }
      }
    });
  }
  
  getPictureTop(picture) {
      let pictureBox = picture.getBoundingClientRect();
      let body = document.body;
      let docEl = document.documentElement;

      let scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;

      let clientTop = docEl.clientTop || body.clientTop || 0;

      let pictureTop  = pictureBox.top + scrollTop - clientTop;
      
      return pictureTop;
  }
  
  setPickerPositionPercentage(position, picker, slide) {
    let realPosition = (this.maxPosition - this.minPosition) * position / 100 + this.minPosition;
  
    this.setPickerPosition(realPosition, picker, slide);
  }


  setPickerPosition(position, picker, slide) {
    if (position < this.minPosition)
      position = this.minPosition;
  
    if (position > this.maxPosition)
      position = this.maxPosition;
  

    picker.style.top = position + 'px';
    slide.style.height = position - this.minPosition + 'px';
  }
  
  updateBlindPosition(hass, entityId, position) {
    let blindPosition = Math.round(position);
  
    hass.callService('cover', 'set_cover_position', {
      entity_id: entityId,
      position: blindPosition
    });
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error('You need to define entities');
    }
    
    this.config = config;
    this.maxPosition = 137;
    this.minPosition = 19;
    this.isUpdating = false;
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return this.config.entities.length + 1;
  }
}

customElements.define("blind-card", BlindCard);

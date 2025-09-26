import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveChat } from './active-chat';

describe('ActiveChat', () => {
  let component: ActiveChat;
  let fixture: ComponentFixture<ActiveChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActiveChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

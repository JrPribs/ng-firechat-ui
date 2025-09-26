import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoActiveChat } from './no-active-chat';

describe('NoActiveChat', () => {
  let component: NoActiveChat;
  let fixture: ComponentFixture<NoActiveChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NoActiveChat ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(NoActiveChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

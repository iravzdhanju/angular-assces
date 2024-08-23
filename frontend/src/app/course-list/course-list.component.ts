import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Course, CourseService } from '../course.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CourseEditDialogComponent } from '../course-edit-dialog/course-edit-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  NativeDateAdapter,
} from '@angular/material/core';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CourseEditDialogComponent,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    {
      provide: DateAdapter,
      useClass: NativeDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
  ],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  searchForm: FormGroup;
  filteredOptions: Observable<string[]>;
  displayedColumns: string[] = [
    'university',
    'course_name',
    'start_date',
    'end_date',
    'price',
    'actions',
  ];
  editForm: FormGroup;

  constructor(
    private courseService: CourseService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog
  ) {
    this.searchForm = this.formBuilder.group({
      searchControl: [''],
    });

    this.editForm = this.formBuilder.group({
      _id: [''],
      university: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      course_name: ['', Validators.required],
      course_description: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      currency: ['', Validators.required],
    });

    this.filteredOptions = this.searchForm
      .get('searchControl')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value || ''))
      );
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    const searchTerm = this.searchForm.get('searchControl')!.value || '';
    this.courseService
      .getCourses(searchTerm, this.currentPage, this.itemsPerPage)
      .subscribe((courses) => {
        this.courses = courses;
        this.filteredOptions = this.searchForm
          .get('searchControl')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filter(value || ''))
          );
      });
  }

  onSearch(event: Event): void {
    event.preventDefault();
    this.currentPage = 1;
    this.loadCourses();
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadCourses();
  }

  deleteCourse(id: string): void {
    this.courseService.deleteCourse(id).subscribe(() => {
      this.loadCourses();
    });
  }

  editCourse(course: Course): void {
    this.editForm.patchValue({
      _id: course._id,
      university: course.university,
      city: course.city,
      country: course.country,
      course_name: course.course_name,
      course_description: course.course_description,
      start_date: course.start_date,
      end_date: course.end_date,
      price: course.price,
      currency: course.currency,
    });

    const dialogRef = this.dialog.open(CourseEditDialogComponent, {
      width: '400px',
      data: { form: this.editForm },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const updatedCourse = this.editForm.value;
        this.courseService
          .updateCourse(updatedCourse._id, updatedCourse)
          .subscribe({
            next: () => {
              this.loadCourses();
            },
            error: (error) => {
              console.error('Error updating course:', error);
              // Handle error (e.g., show an error message to the user)
            },
          });
      }
    });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const allOptions = this.courses.map((course) => course.course_name);
    const uniqueOptions = Array.from(new Set(allOptions));
    return uniqueOptions.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }
}
